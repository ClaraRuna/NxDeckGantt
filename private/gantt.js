import { Gantt } from "./frappe-gantt";

export function createGantt(tasks, userLang = "en", zoomMode = "Day") {
  let lang = userLang.slice(0, 2);

  var gantt = new Gantt("#GanttChart", tasks,{
    header_height: 50,
    column_width: 30,
    step: 24,
    view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
    bar_height: 30,
    bar_corner_radius: 3,
    arrow_curve: 5,
    padding: 18,
    view_mode: zoomMode,
    date_format: "YYYY-MM-DD",
    custom_popup_html: null,
    custom_class: "bar-red",
    language: lang,
    on_click: function (task) {
    },
    on_date_change: function (task, start, end) {
      task.setDueDateAndDuration(start, end);
    },
    on_progress_change: function (task, progress) {
      task.setProgress(progress);
    },
    on_view_change: function (mode) {
    },
  });
  window.gantt = gantt;
}
