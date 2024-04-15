import { Gantt } from "./frappe-gantt";

export function createGantt(tasks) {
  /*  console.log("createGantt")
  console.log(tasks)*/

  var gantt = new Gantt("#GanttChart", tasks, {
    header_height: 50,
    column_width: 30,
    step: 24,
    view_modes: ["Quarter Day", "Half Day", "Day", "Week", "Month"],
    bar_height: 30,
    bar_corner_radius: 3,
    arrow_curve: 5,
    padding: 18,
    view_mode: "Day",
    date_format: "YYYY-MM-DD",
    custom_popup_html: null,
    custom_class: "bar-red",
    //ToDo dynamic language
    language: "en",
    on_click: function (task) {
      console.log(task);
    },
    on_date_change: function (task, start, end) {
      task.setDueDateAndDuration(start, end);
    },
    on_progress_change: function (task, progress) {
      task.setProgress(progress)
    },
    on_view_change: function (mode) {
      console.log(mode);
    },
  });
}
