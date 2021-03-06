import { hideAuxiliaryElementsInParent } from './iframe-drag-n-drop';
import { popupDelete } from './popup-in-builder-gridster-snap';

function initGridOutofBuilder() {
    if ($('.gridster').length) {
        var gridster = $(".gridster").gridster({
            widget_selector: 'div.gridster > div',
            widget_margins: [5, 5],
            widget_base_dimensions: ['auto', 50],
            shift_widgets_up: false,
            shift_larger_widgets_down: false,
            max_cols: 12,
            max_rows: 60,
        }).data('gridster');
        gridster.disable();
    }
}

let gridster;

function enableGridster() {
    gridster.enable();
}

function disableGridster() {
    gridster.disable();
}

function initGridInBuilder() {
    if ($('.gridster').length) {
        gridster = $(".gridster").gridster({
            widget_selector: 'div.gridster > div',
            widget_margins: [0, 0],
            widget_base_dimensions: ['auto', 50],
            shift_widgets_up: false,
            shift_larger_widgets_down: false,
            max_cols: 12,
            max_rows: 60,
            resize: {
                enabled: true,
                start: hideAuxiliaryElementsInParent
            },
            draggable: {
                start: hideAuxiliaryElementsInParent,
                // exclude form children elements to prevent intervention with jquery-ui sortable
                handle: '*:not(form *, button, div.row *)'
            }
        }).data('gridster');
        $('div.gridster > div').each(function () {
            if (!$(this).has('span.gs-remove-handle').length) {
                $('<span class="gs-remove-handle"></span>').appendTo(this);
            }
        });
        $('div.gridster').on('click', 'div > span.gs-remove-handle', function () {
            popupDelete(this, '确定删除吗？该操作不可撤销！！！',
                () => {
                    layer.closeAll('dialog');
                    gridster.remove_widget($(this).parent());
                    hideAuxiliaryElementsInParent();
                });
        });
    }
    $('.grid-footer button').click(function () {
        const addedWidget = gridster.add_widget('<div><span class="gs-remove-handle"></span></div>', 3, 3);
        addedWidget && window.parent.enableSortableAndDroppable(addedWidget);
    });
}

export {
    initGridInBuilder,
    initGridOutofBuilder,
    enableGridster,
    disableGridster
};