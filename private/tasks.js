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
          card.owner.uid,
          card.duedate
        );
        //here the Dates are wrong
        console.log("dueDate");
        console.log(card.duedate);
        console.log("newTask");
        console.log(newTask);
        tasks.push(newTask);
      }
    }
  }
  return tasks;
}

export function getScheduledTasks(tasks) {
  let filteredTasks = tasks.filter(function (task) {
    return task.isScheduled();
  });
  filteredTasks.sort(function (a, b) {
    return a.start - b.start;
  });
  return filteredTasks;
}

export function getUnscheduledTasks(tasks) {
  return tasks.filter(function (task) {
    return !task.isScheduled();
  });
}

class Task {
  constructor(id, name, stackId, description, order, owner, dueDate) {
    this.id = id;
    this.name = name;
    this.stackId = stackId;
    this.description = description;
    this.order = order;
    this.owner = owner;
    this.end = this.calculateEnd(dueDate);
    this.duration = this.getDurationFromDescription(description);
    this.start = this.calculateStart();
    this.class = this.getClassFromDescription(description);
    this.progress = this.getProgressFromDescription(description);
    this.dependencies = this.getDependenciesFromDescription(description);
  }

  calculateStart() {
    if (!this.end) {
      return null;
    } else if (!this.duration) {
      let startDate = new Date(this.end);
      startDate.setDate(startDate.getDate() - 1);
      return startDate;
    }
    let startDate = new Date(this.end);
    startDate.setDate(startDate.getDate() - this.duration);
    return startDate;
  }

  // transform date to string
  calculateEnd(date) {
    if (!date) {
      return null;
    } else {
      return new Date(date);
    }
  }

  getDurationFromDescription(taskDescription) {
    return this.extractFromDescription(taskDescription, "d") || 1;
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

  setDurationInDescription(task, newDurationInDays) {
    /*    // To calculate the time difference of two dates
    var durationInTime = end.getTime() - start.getTime();
    // To calculate the nb of days between two dates
    var durationInDays = Math.round(durationInTime / (1000 * 3600 * 24));

    console.log(description.search(/d:(.*?):d/));
    if (description.search(/d:(.*?):d/) != -1) {
      description = description.replace(
        /d:(.*?):d/,
        "d:" + (durationInDays - 1) + ":d"
      );
    } else {
      description = "d:" + (durationInDays - 1) + ":d\n" + description;
    }*/
    this.setInDescription(task, "d", 1);
  }

  setClassInDescription(task, newClass) {
    this.setInDescription(task, letter, value);
  }

  setProgressInDescription(task, newProgress) {
    this.setInDescription(task, letter, value);
  }

  setDependencyInDescription(task, newDependency) {
    this.setInDescription(task, letter, value);
  }
  setInDescription(task, letter, value) {
    let regex = new RegExp(letter + ":(.*?):" + letter);
    let newExp = `${letter}:${value}:${letter}`;
    let description = task.description;
    if (description.search(regex) !== -1) {
      description = description.replace(regex, newExp);
    } else {
      description = description + newExp;
    }
    task.description = description;
    this.pushToRemote(task);
  }

  isScheduled() {
    if (this.end) {
      return true;
    }
    return false;
  }

  pushToRemote(task) {}
}

function udpateCard(task, start, end, progress = null) {
  /*  if (progress) {
    description = description.replace(/p:(.*?):p/, "p:" + progress + ":p");
  }

  let params = {
    title: task.name,
    description: description,
    type: "plain",
    order: 999,
    duedate: end,
    owner: "",
  };

  sendRequest(
    "PUT",
    apiUrl +
      "/" +
      task.board_id +
      "/stacks/" +
      task.stack_id +
      "/cards/" +
      task.card_id,
    JSON.stringify(params),
    false,
    "cardUpdated"
  );*/
}
