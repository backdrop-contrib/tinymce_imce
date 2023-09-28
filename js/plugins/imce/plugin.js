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
      let imgClass = editor.selection.getNode().getAttribute('class');
      let icon;
      switch (imgClass) {
        case 'align-left':
          icon = 'floatleft';
          break;
        case 'align-center':
          icon = 'aligncenter';
          break;
        case 'align-right':
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
      if (value == 'none') {
        img.removeAttribute('class');
      }
      else {
        img.setAttribute('class', value);
      }
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
      let imgClass = editor.selection.getNode().getAttribute('class');
      if (!imgClass && value == 'none') {
        return true;
      }
      return imgClass == value;
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
          value: 'align-left'
        },
        {
          type: 'choiceitem',
          text: 'Align center',
          icon: 'aligncenter',
          value: 'align-center'
        },
        {
          type: 'choiceitem',
          text: 'Float right',
          icon: 'floatright',
          value: 'align-right'
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

  // All the custom icons used by this plugin.
  let lowVision = '<svg width="20" height="16" version="1.1" viewBox="0 0 20 16"><path d="m2.6923 0-1.0694 1.0509 2.7376 2.6902a10.001 4.9218 0 0 0-4.3604 4.0624 10.001 4.9218 0 0 0 9.999 4.9217 10.001 4.9218 0 0 0 3.2339-0.26322l3.6002 3.5379 1.0694-1.0509-2.9266-2.876a10.001 4.9218 0 0 0 5.0241-4.2695 10.001 4.9218 0 0 0-10.001-4.9217 10.001 4.9218 0 0 0-0.092568 0 10.001 4.9218 0 0 0-3.87 0.4045zm10.395 4.2908a8.8211 3.7511 0 0 1 5.7331 3.5128 8.8211 3.7511 0 0 1-4.6677 3.3095 5.0279 4.8391 31.428 0 0-0.57312-6.3965 5.0279 4.8391 31.428 0 0-0.068932-0.067739 5.0279 4.8391 31.428 0 0-0.42344-0.35805zm-7.8149 0.34644 6.9188 6.801a8.8211 3.7511 0 0 1-2.192 0.11612 8.8211 3.7511 0 0 1-8.8193-3.7508 8.8211 3.7511 0 0 1 4.0926-3.1663zm4.7642 0.085157a3.4546 3.3949 0 0 1 2.4618 0.92899 3.4546 3.3949 0 0 1 0.06499 0.063868 3.4546 3.3949 0 0 1 0.37814 4.3566l-1.0615-1.0412a1.9938 1.9593 0 0 0-0.35057-2.2993 1.9938 1.9593 0 0 0-0.02167-0.023224 1.9938 1.9593 0 0 0-2.32-0.32321l-1.0596-1.0412a3.4546 3.3949 0 0 1 1.9084-0.62127z"/></svg>';
  editor.ui.registry.addIcon('lowvision', lowVision);
  let floatNone = '<svg width="20" height="17" version="1.1" viewBox="0 0 20 17"><g fill="none" stroke="#000" stroke-width="2"><path d="m1 1h9v10h-9z" stroke-linecap="square"/><path d="m13 11h7"/><path d="m0 16h20"/></g></svg>';
  editor.ui.registry.addIcon('floatnone', floatNone);
  let floatLeft = '<svg width="20" height="17" version="1.1" viewBox="0 0 20 17"><rect x="1" y="1" width="9" height="10" style="fill:none;stroke-linecap:round;stroke-width:2;stroke:#000"/><path d="m13 11h7" style="fill:none;stroke-width:2;stroke:#000"/><path d="m0 16h20" style="fill:none;stroke-width:2;stroke:#000"/><path d="m13 1h7" style="fill:none;stroke-width:2;stroke:#000"/><path d="m13 6h7" style="fill:none;stroke-width:2;stroke:#000"/></svg>';
  editor.ui.registry.addIcon('floatleft', floatLeft);
  let alignCenter = '<svg width="20" height="17" version="1.1" viewBox="0 0 20 17"><g fill="none" stroke="#000" stroke-width="2"><rect x="5" y="5" width="10" height="7" stroke-linecap="round"/><path d="m0 16h20"/><path d="m0 1h20"/></g></svg>';
  editor.ui.registry.addIcon('aligncenter', alignCenter);
  let floatRight = '<svg width="20" height="17" version="1.1" viewBox="0 0 20 17"><g fill="none" stroke="#000" stroke-width="2"><rect transform="scale(-1,1)" x="-19" y="1" width="9" height="10" stroke-linecap="round"/><g><path d="m7 11h-7"/><path d="m0 16h20"/><path d="m7 1h-7"/><path d="m7 6h-7"/></g></g></svg>';
  editor.ui.registry.addIcon('floatright', floatRight);
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
