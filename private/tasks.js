export function createTasks(stacks) {
    // put relevant task data into array that can then be attached to
    let tasks = [];
    for (let stack of stacks) {
        if (stack.cards) {
            for (let card of stack.cards) {
                let newTask = new Task(card.id,
                    card.title,
                    card.stackId,
                    card.description,
                    card.order,
                    card.duedate)
                tasks.push(newTask);
                console.log(newTask);
            }
        }
    }
}

/*if (tasksArray.length > 0) {
  document.getElementById("board_error").style.display = "none";
  document.getElementById("gantt").style.display = "block";

  createGantt(
    tasksArray.sort(function (a, b) {
      return a.refDate.getTime() - b.refDate.getTime();
    })
  );
} else {
  document.getElementById("board_error").style.display = "block";
  document.getElementById("gantt").style.display = "none";
  document.getElementById("board_error").innerHTML =
    "No card available check if due date is set ?";
}*/

function extractFromDescription(taskDescription, letter) {
    if (taskDescription.indexOf(`${letter}:`) !== -1) {
        return taskDescription.substring(
            taskDescription.indexOf(`${letter}:`) + 2,
            taskDescription.indexOf(`:${letter}`)
        );
    }
    return null;
}

function getDurationFromDescription(taskDescription) {
    return extractFromDescription(taskDescription, "d");
}

function getClassFromDescription(taskDescription) {
    return extractFromDescription(taskDescription, "c");
}

function getProgressFromDescription(taskDescription) {
    return extractFromDescription(taskDescription, "p");
}

function getDependenciesFromDescription(task) {
    return extractFromDescription(task, "w");
}

class Task {
    constructor(id, name, stackId, description, order, dueDate) {
        this.id = id;
        this.name = name;
        this.stackId = stackId;
        this.description = description;
        this.order = order;
        this.setDueDate(dueDate);
        this.duration = getDurationFromDescription(description);
        this.class = getClassFromDescription(description);
        this.progress = getProgressFromDescription(description);
        this.dependencies = getDependenciesFromDescription(description);
    }

    getStartDate() {
        if (!(this.dueDate && this.duration)) {
            return null;
        }
        return this.dueDate - this.duration;
    }

    setDueDate(date){
        if (!date){
            this.dueDate = null;
        }
        else{
            this.dueDate = new Date(date);
        }
    }
}
