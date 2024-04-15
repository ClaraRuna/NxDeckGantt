import conf from "./conf";
import {getCredentials} from "./login";

export function createTasks(stacks, deckId) {
  let tasks = [];
  for (let stack of stacks) {
    console.log(stack);
    if (stack.cards) {
      for (let card of stack.cards) {
        let newTask = new Task(
          card.id,
          card.title,
          card.stackId,
          card.description,
          card.order,
          card.owner.uid,
          card.duedate,
          deckId
        );
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
  constructor(id, name, stackId, description, order, owner, dueDate, deckId) {
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
    this.deckId = deckId;
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

  calculateDuration() {
    if (!this.end) {
      return null;
    } else if (!this.start) {
      return 1;
    }
    return this.end.getDate() - this.start.getDate();
  }

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

  setDueDateAndDuration(start, end) {
    const msPerDay = 1000 * 60 * 60 * 24;
    let duration = Math.round((end - start)/msPerDay);
    this.setDurationInDescription(duration);
    console.log("old duedate: " + this.end);
    console.log("new duedate: " + end)
    this.end = this.calculateEnd(end);
    console.log(this.end);
    console.log(duration);
    this.putToRemote();
  }
  setDurationInDescription(newDurationInDays) {
    this.setInDescription("d", newDurationInDays);
  }

  //currently unused
  setClassInDescription(task, newClass) {
    this.setInDescription("c", newClass);
  }

  setProgressInDescription(newProgress) {
    this.setInDescription("p", newProgress);
  }

  setProgress(newProgress){
    this.setProgressInDescription(newProgress);
    this.putToRemote();
  }

  setDependencyInDescription(task, newDependency) {
    this.setInDescription(task, letter, value);
  }
  setInDescription(letter, value) {
    console.log("old description: " + this.description);
    let regex = new RegExp(letter + ":(.*?):" + letter);
    let newExp = `${letter}:${value}:${letter}`;
    let description = this.description;
    if (description.search(regex) !== -1) {
      description = description.replace(regex, newExp);
    } else {
      description = description + newExp + "\n";
    }
    console.log("new description: " + description);
    this.description = description;
  }

  isScheduled() {
    if (this.end) {
      return true;
    }
    return false;
  }

  putToRemote() {
    let requestData = {
      description: this.description,
      duedate: this.end,
      order: this.order,
      owner: this.owner,
      title: this.name,
      type: "plain",
    };

    fetch(
      conf.NC_URL +
        conf.BOARD_ENDPOINT +
        `/${this.deckId}/stacks/${this.stackId}/cards/${this.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + getCredentials(),
        },
        body: JSON.stringify(requestData),
      }
    );
  }
}
