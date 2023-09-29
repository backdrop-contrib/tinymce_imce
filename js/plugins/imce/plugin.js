/**
 * @file
 * TinyMCE IMCE plugin.
 */
"use strict";

tinymce.PluginManager.add('imce', function(editor, url) {
  // The toolbar button.
  editor.ui.registry.addToggleButton('imce', {
    icon: 'edit-image',
    tooltip: 'Insert image with IMCE',
    onAction: function () {
      imceTools.openDialog(editor);
    },
    onSetup: function (api) {
      api.setActive(false);
      editor.on('SelectionChange', function () {
        let node = editor.selection.getNode();
        if (imceTools.isRegularImg(node)) {
          api.setActive(true);
        }
        else {
          api.setActive(false);
        }
      });
      editor.on('dblclick', function (ev) {
        let node = editor.selection.getNode();
        if (imceTools.isRegularImg(node)) {
          imceTools.openDialog(editor);
        }
      });
    }
  });

  // The menu item for the menubar.
  editor.ui.registry.addMenuItem('imce', {
    icon: 'edit-image',
    text: 'Image...',
    onAction: function () {
      imceTools.openDialog(editor);
    }
  });

  // Dropdown button for the context menu.
  editor.ui.registry.addSplitButton('imcealign', {
    icon: 'floatnone',
    tooltip: 'Image alignment',
    onAction: function () {},
    onSetup: function (api) {
      let align = editor.selection.getNode().getAttribute('data-align');
      let icon;
      switch (align) {
        case 'left':
          icon = 'floatleft';
          break;
        case 'center':
          icon = 'aligncenter';
          break;
        case 'right':
          icon = 'floatright';
          break;
        default:
          icon = 'floatnone';
      }
      api.setIcon(icon);
    },
    onItemAction: function (api, value) {
      let img = editor.selection.getNode();
      let bookmark = editor.selection.getBookmark();
      img.setAttribute('data-align', value);
      // Hm, that's a LOT of code just to move... think it over!
      editor.dispatch('contexttoolbar-hide', {
        toolbarKey: 'imcecontext'
      });
      // Floating an image changes content height.
      editor.dispatch('ResizeEditor');
      // Focus lost (outside editor).
      editor.focus();
      // Really?
      editor.selection.moveToBookmark(bookmark);
      img.setAttribute('data-mce-selected', 1);
      editor.selection.controlSelection.showResizeRect(img);
    },
    select: function (value) {
      let align = editor.selection.getNode().getAttribute('data-align');
      if (!align && value == 'none') {
        return true;
      }
      return align == value;
    },
    fetch: function (callback) {
      const items = [
        {
          type: 'choiceitem',
          text: 'No float',
          icon: 'floatnone',
          value: 'none'
        },
        {
          type: 'choiceitem',
          text: 'Float left',
          icon: 'floatleft',
          value: 'left'
        },
        {
          type: 'choiceitem',
          text: 'Align center',
          icon: 'aligncenter',
          value: 'center'
        },
        {
          type: 'choiceitem',
          text: 'Float right',
          icon: 'floatright',
          value: 'right'
        }
      ];
      callback(items);
    }
  });

  // The button to open the form for alt text.
  editor.ui.registry.addButton('form:imcealtform', {
    type: 'contextformbutton'
  });
  // The form opened by above button.
  editor.ui.registry.addContextForm('imcealtform', {
    launch: {
      type: 'contextformbutton',
      icon: 'lowvision',
      text: '!!',
      tooltip: 'Alternative text',
      onSetup: function (api) {
        let alt = editor.selection.getNode().getAttribute('alt');
        if (alt) {
          api.setText('✓');
        }
      }
    },
    label: 'Image alternative text',
    initValue: function () {
      let img = editor.selection.getNode();
      return img.getAttribute('alt');
    },
    commands: [
      {
        type: 'contextformtogglebutton',
        text: 'Update ↵',
        primary: true,
        onAction: function (formApi) {
          const value = formApi.getValue();
          let img = editor.selection.getNode();
          img.setAttribute('alt', value);
          formApi.hide();
        }
      }
    ]
  });

  // The context toolbar for images.
  editor.ui.registry.addContextToolbar('imcecontext', {
    predicate: function (node) {
      return imceTools.isRegularImg(node);
    },
    items: 'form:imcealtform imcealign',
    scope: 'node',
    position: 'node'
  });
});

const imceTools = {}
/**
 * Check if this is an image to handle.
 *
 * @param object node
 *   Dom node.
 */
imceTools.isRegularImg = function (node) {
  if (node.nodeName != 'IMG') {
    return false;
  }
  if (node.hasAttribute('data-mce-object') || node.hasAttribute('data-mce-placeholder')) {
    return false;
  }
  if (node.src.startsWith('data:')) {
    return false;
  }
  return true;
}

/**
 * Opens a TinyMCE dialog which contains IMCE.
 */
imceTools.openDialog = function (editor) {
  editor.windowManager.openUrl({
    title: editor.options.get('imceDialogTitle'),
    url: editor.options.get('imceUrl')
  });
}

/**
 * IMCE isn't aware of file-IDs, so we fetch and set them separately.
 *
 * @param string url
 *   Image url.
 */
imceTools.setFileId = function (url) {
  const XHR = new XMLHttpRequest();
  const formData = new FormData();
  formData.append('url', url);

  XHR.addEventListener('load', function (event) {
    if (event.target.status == 200) {
      if (event.target.responseText) {
        let fid = JSON.parse(event.target.responseText);
        // "0" means file not found.
        if (!fid) {
          return;
        }
        let editor = tinymce.activeEditor;
        let imgDomnode = editor.getBody().querySelector('[src="' + url + '"]');
        imgDomnode.setAttribute('data-file-id', fid);
      }
    }
    else {
      console.log(event.target.status);// @todo
    }
  });

  XHR.addEventListener('error', function (event) {
    console.log(event);// @todo
  });

  let fetchUrl = '/tinymce-imce/fid';
  XHR.open('POST', fetchUrl);
  XHR.send(formData);
}

/**
 * Callback to which IMCE will respond, set via imceUrl param.
 *
 * @param object file
 *   File related data returned from IMCE.
 * @param object win
 *   Unused here.
 */
function tinymceImceResponseHandler (file, win) {
  let editor = tinymce.activeEditor;
  let imageTypes = ['jpeg', 'jpg', 'gif', 'png', 'webp'];
  let extension = file.name.toLowerCase().split('.').pop();
  if (!imageTypes.includes(extension)) {
    editor.notificationManager.open({
      text: 'Not an image',
      type: 'error',
      icon: 'warn'
    });
    editor.windowManager.close();
    return;
  }
  let img = editor.dom.create('img', {
    src: file.url,
    width: file.width,
    height: file.height
  });
  img.setAttribute('alt', '');
  editor.insertContent(img.outerHTML);
  editor.windowManager.close();
  imceTools.setFileId(file.url);
}
