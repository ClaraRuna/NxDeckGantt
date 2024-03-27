export function createTasks(stacks) {
  let tasks = [];
  for (let stack of stacks) {
    if (stack.cards) {
      for (let card of stack.cards) {
        let newTask = new Task(
          card.id,
          card.title,
          card.stackId,
          card.description,
          card.order,
          card.duedate
        );
        tasks.push(newTask);
      }
    }
  }
  return tasks;
}

export function getScheduledTasks(tasks){
  let filteredTasks = tasks.filter(function(task) { return task.isScheduled()});
  filteredTasks.sort(function (a, b) {
    return a.dueDate - b.dueDate;
  })
  console.log(filteredTasks);
  return filteredTasks;
}

export function getUnscheduledTasks(tasks){
  return tasks.filter(function(task) { return !task.isScheduled()});
}

class Task {
  constructor(id, name, stackId, description, order, dueDate) {
    this.id = id;
    this.name = name;
    this.stackId = stackId;
    this.description = description;
    this.order = order;
    this.dueDate = this.constructDueDate(dueDate);
    this.duration = this.getDurationFromDescription(description);
    this.class = this.getClassFromDescription(description);
    this.progress = this.getProgressFromDescription(description);
    this.dependencies = this.getDependenciesFromDescription(description);
  }

  getStartDate() {
    if (!(this.dueDate && this.duration)) {
      return null;
    }
    return this.dueDate - this.duration;
  }

  // transform date to string
  constructDueDate(date) {
    if (!date) {
      return null;
    } else {
      return new Date(date);
    }
  }

  getDurationFromDescription(taskDescription) {
    return this.extractFromDescription(taskDescription, "d");
  }

  getClassFromDescription(taskDescription) {
    return this.extractFromDescription(taskDescription, "c");
  }

  getProgressFromDescription(taskDescription) {
    return this.extractFromDescription(taskDescription, "p");
  }

  getDependenciesFromDescription(task) {
    return this.extractFromDescription(task, "w");
  }

  extractFromDescription(taskDescription, letter) {
    if (taskDescription.indexOf(`${letter}:`) !== -1) {
      return taskDescription.substring(
          taskDescription.indexOf(`${letter}:`) + 2,
          taskDescription.indexOf(`:${letter}`)
      );
    }
    return null;
  }

  isScheduled(){
    if(this.dueDate){
      return true;
    }
    return false;
  }
}
