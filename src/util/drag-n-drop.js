import Vvveb from '../gui/components';
import ChildListMutation from '../models/mutation/child-list-mutation';
import { isOverlap } from '../util/dom';
import { componentSelector, sortableDivSelector } from './selectors';
import MoveMutation from '../models/mutation/move-mutation';
import _ from 'lodash';
import {
    textinputfieldid, datetimeinputfieldid, fileinputfieldid,
    autoselectinputfieldid, manualselectinputfieldid, multivalueselectinputfieldid,
    textareafieldid, radiofieldid, checkboxfieldid, popuptextinputid, popupmanualselectinputid,
    customtableid, commontableid, formid, gridrowid, buttonid, bootstraptextinputfieldid, bootstraptextareafieldid,
    bootstrapfileinputfieldid,
    bootstrapautoselectinputfieldid
} from '../components/@oee/ids';
import {
    popupFormItemsScope, customTablesScope, gridDroppablesScope, combinedSelector
} from '../common';
import 'core-js/es7/array';

const popupFormItems = [
    popuptextinputid,
    popupmanualselectinputid
];

const customTables = [
    customtableid,
];

const gridDroppables = [
    buttonid,
    textinputfieldid,
    datetimeinputfieldid,
    fileinputfieldid,
    autoselectinputfieldid,
    manualselectinputfieldid,
    multivalueselectinputfieldid,
    textareafieldid,
    radiofieldid,
    checkboxfieldid,
    formid,
    commontableid,
    gridrowid,
    bootstraptextinputfieldid,
    bootstraptextareafieldid,
    bootstrapfileinputfieldid,
    bootstrapautoselectinputfieldid
];

const componentScopes = _.reduce({
    customTables,
    popupFormItems,
    gridDroppables,
}, (prev, v, k) => {
    _.extend(prev, ...v.map(v => {
        const obj = {};
        obj[v] = k;
        return obj
    }));
    return prev;
}, {});

function getCursorAt($element) {
    const display = $element.css('display');
    if (display == 'inline-block') {
        return {
            left: $element.outerWidth() / 2,
            top: $element.outerHeight() / 2,
        };
    } else {
        return {
            left: 20,
            top: 20
        };
    }
}

function initComponentDrag(item, component) {
    const html = component.dragHtml || component.html;
    const cursorAt = getCursorAt($(html));
    $(item).draggable({
        iframeFix: true,
        // Use https://maxazan.github.io/jquery-ui-droppable-iframe/ to deal with
        // iframe scroll issue
        // Use jquery-ui scope instead of accept to circumvent bugs in
        // https://github.com/maxazan/jquery-ui-droppable-iframe/issues/4
        iframeScroll: true,
        scope: componentScopes[item.data('type')],
        helper() {
            const $element = $(html).appendTo($('body'));
            $element.css({ 'z-index': 15 });
            return $element;
        },
        cursorAt,
        drag() {
        },
        stop() {
        },
        revert: 'invalid'
    });
}

function initTopPanelDrag() {
    $('#top-panel').draggable({
        iframeFix: true,
        axis: 'x',
        cursor: 'e-resize'
    });
}

const droppableClasses = {
    "ui-droppable-hover": "ui-state-hover"
};

function enableSortableAndDroppable(elements, scope = gridDroppablesScope, connectWith = combinedSelector) {
    $(elements)
        .sortable({
            connectWith,
            cursor: 'move',
            // Prevents sorting if you start on elements matching the selector.
            // Default: "input,textarea,button,select,option"
            cancel: "option, div.ui-resizable-handle",
            start: onSortingStarts,
            update: onSortingUpdates
        })
        .droppable({
            classes: droppableClasses,
            greedy: true,
            scope,
            drop
        });
}

const uiDraggableDraggingClass = 'ui-draggable-dragging';

const resetCss = {
    position: '',
    left: '',
    top: ''
};

// Append helper to droppable
// https://stackoverflow.com/questions/4652305/jquery-ui-drop-helper
// jquery-ui add 'ui-draggable-dragging' to helper and remove it after drop ends
// We need to remove this class if we clone helper otherwise it will cause bugs
// in _drop function
function cloneAndAppendTo(helper, element, css = resetCss) {
    return helper.clone(false).appendTo(element)
        .css(css)
        .removeClass(uiDraggableDraggingClass);
}

function cloneAndInsertBefore(helper, element, css = resetCss) {
    return helper.clone(false).insertBefore(element)
        .css(css)
        .removeClass(uiDraggableDraggingClass);
}

function drop(event, { draggable, helper, offset }) {
    // Check drag elements from inside or out of iframe
    if (draggable == helper) {
        $(this).append(draggable);
    } else {
        const component = Vvveb.Components.matchNode(helper.get(0));
        let appendedElement;
        if (component.onDrop) {
            appendedElement = component.onDrop(helper);
        } else if (component.sortable) {
            // Check if the drop zone is popup form
            if ($(this).is('form.popup-form')) {
                appendedElement = cloneAndInsertBefore(helper, $(this).find('.saveArea'));
            } else {
                appendedElement = cloneAndAppendTo(helper, this);
            }
        } else {
            appendedElement = cloneAndAppendTo(helper, this, {
                position: '',
                left: 0,
                top: 0,
                width: component.width || '100%',
                height: component.height || '100%',
            });
            if (appendedElement.is('form')) {
                enableSortableAndDroppable(appendedElement);
            } else if (appendedElement.is('div.row')) {
                enableSortableAndDroppable(appendedElement.children());
            }
        }
        if (component.afterDrop) {
            component.afterDrop(appendedElement.get(0));
        }
        if (component.beforeInit) {
            component.beforeInit(appendedElement.get(0));
        }
        Vvveb.Undo.addMutation(new ChildListMutation({
            target: appendedElement.get(0).parentNode,
            addedNodes: [...appendedElement],
            nextSibing: appendedElement[0].nextSibing
        }));
    }
}

function initIframeTableDrop() {
    Vvveb.Builder.frameBody
        .find('.containerRight .allContent .topContent .container .row .everyBox .boxarea .userList #myGrid')
        .droppable({
            scope: customTablesScope,
            drop
        });
}

function enableGridItemDrop(elements) {
    $(elements)
        .droppable({
            greedy: true,
            classes: droppableClasses,
            scope: gridDroppablesScope,
            drop
        });
}

function initIframeGridDrop() {
    enableGridItemDrop(Vvveb.Builder.frameBody.find('div.gridster > div'));
}

function initIframeFormItemsDrop() {
    Vvveb.Builder.frameBody
        .find('.allButton.dropzone')
        .droppable({
            greedy: true,
            classes: droppableClasses,
            scope: gridDroppablesScope,
            drop
        });
}

function initIframePopupDrop() {
    Vvveb.Builder.frameBody
        .find('div.popup-window form.popup-form')
        .droppable({
            greedy: true,
            scope: popupFormItemsScope,
            drop
        });
}

function initIframeDrag() {
    Vvveb.Builder.frameBody
        .find('.draggable')
        .draggable({
            containment: 'document'
        });
}

let sortingMutation;

function getNextSortableSiblingElement(target) {
    // exclude div.ui-sortable-placeholder
    return $(target).nextAll(sortableDivSelector).get(0);
}

function onSortingStarts(event, { item }) {
    const target = item.get(0);
    sortingMutation = new MoveMutation({
        target,
        oldParent: target.parentNode,
        oldNextSibling: getNextSortableSiblingElement(target)
    });
}

function onSortingUpdates(event, { item }) {
    const target = item.get(0);
    sortingMutation.newParent = target.parentNode;
    sortingMutation.newNextSibling = getNextSortableSiblingElement(target);
    Vvveb.Undo.addMutation(sortingMutation);
}

function initIfameFormSortable() {
    Vvveb.Builder.frameBody
        .find('.allButton.dropzone')
        .sortable({
            cursor: 'move',
            classes: {
                'ui-state-highlight': 'form-sortable-placeholder'
            },
            placeholder: 'ui-state-highlight',
            forcePlaceholderSize: true,
            // Prevents sorting if you start on elements matching the selector.
            // Default: "input,textarea,button,select,option"
            cancel: "button, option, div.ui-resizable-handle",
            start: onSortingStarts,
            update: onSortingUpdates
        });
}

function initIframePopupSortable() {
    Vvveb.Builder.frameBody
        .find('div.popup-window form.popup-form')
        .sortable({
            cursor: 'move',
            cancel: "button, option, div.ui-resizable-handle",
            start: onSortingStarts,
            update: onSortingUpdates
        });
}

function initIframeSortable() {
    initIfameFormSortable();
    initIframePopupSortable();
}

// Resizing element would create elements right above the resizable element,
// which could interfere with the sortable elements.
function initIframeResizeVetically() {
    Vvveb.Builder.frameBody
        .find('.resize-vertically')
        .resizable({
            handles: 's'
        });
}

function initComponentDragWithInteract() {
    let $element;
    window.interact = frames[0].interact;
    interact(componentSelector, { context: document })
        .draggable({
            // enable inertial throwing
            inertia: true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: document.getElementById('iframeId').contentWindow.document.body,
                endOnly: true,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            // enable autoScroll
            autoScroll: true,
            onstart(event) {
                const component = Vvveb.Components.get($(event.target).data("type"));
                const html = component.dragHtml || component.html;
                $element = $(html).appendTo($('body'));
                const display = $element.css('display');
                if (display == 'inline-block') {
                    $element.css({
                        position: 'absolute',
                        left: event.pageX - $element.outerWidth() / 2,
                        top: event.pageY - $element.outerHeight() / 2,
                        'z-index': 999
                    });
                } else {
                    $element.css({
                        position: 'absolute',
                        left: event.pageX - 20,
                        top: event.pageY - 20,
                        'z-index': 999
                    });
                }
            },
            // call this function on every dragmove event
            onmove: event => {
                const x = (parseFloat($element.attr('data-x')) || 0) + event.dx,
                    y = (parseFloat($element.attr('data-y')) || 0) + event.dy;
                $element
                    .css({
                        transform: `translate(${x}px, ${y}px)`
                    })
                    .attr({
                        'data-x': x,
                        'data-y': y
                    });
            },
            // call this function on every dragend event
            onend: event => {
                const component = Vvveb.Components.matchNode($element[0]);
                isElementCreated = false;
                let appendedElement;
                if (component.onDrop) {
                    appendedElement = component.onDrop($element[0]);
                } else {
                    const left = $element.offset().left - $('#iframeId').offset().left,
                        top = $element.offset().top - $('#iframeId').offset().top;
                    // 直接替换元素会有拖动问题，可能是因为元素本身在父页面，所以包含一些特殊属性有关
                    // 获得html字符串，然后再进行替换
                    let appendToElement = Vvveb.Builder.frameBody;
                    if (component.dropzone
                        && isOverlap($element.get(0), Vvveb.Builder.frameBody.find(component.dropzone).get(0))) {
                        appendToElement = Vvveb.Builder.frameBody.find(component.dropzone);
                    }
                    appendToElement.append($element.prop("outerHTML"));
                    appendedElement = appendToElement
                        .children('*:last')
                        .css({
                            transform: '',
                            left: '',
                            top: ''
                        })
                        .offset({
                            left,
                            top
                        })
                        .removeAttr('data-x data-y');
                }
                $element.remove();
                Vvveb.Undo.addMutation(new ChildListMutation({
                    target: appendedElement.get(0).parentNode,
                    addedNodes: [appendedElement.get(0)],
                    nextSibing: appendedElement[0].nextSibing
                }));
            }
        });
}

export {
    initTopPanelDrag,
    initComponentDrag,
    initIframeTableDrop,
    initIframeGridDrop,
    initIframeFormItemsDrop,
    initIframePopupDrop,
    initIframeDrag,
    initComponentDragWithInteract,
    initIframeSortable,
    initIframeResizeVetically,
    enableSortableAndDroppable,
    enableGridItemDrop
};