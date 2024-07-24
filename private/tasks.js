import conf from "./conf";
import { getCredentials } from "./login";
import { setErrorMessage } from "./decks";
import { translate } from "./translations";

const ganttInfoDelimiter = "#######"

export function createTasks(stacks, deckId) {
  let tasks = [];
  for (let stack of stacks) {
    if (stack.cards) {
      for (let card of stack.cards) {
        let color = null;
        if (card.labels.length > 0) {
          color = card.labels[0].color;
        }
        let newTask = new Task(
          card.id,
          card.title,
          card.stackId,
          card.description,
          card.order,
          card.owner.uid,
          card.duedate,
          color,
          deckId
        );
        tasks.push(newTask);
      }
    }
  }
  return tasks;
}

export function filterScheduledTasks(tasks = []) {
  let filteredTasks = tasks.filter(function (task) {
    return task.isScheduled();
  });
  filteredTasks.sort(function (a, b) {
    return a.start - b.start;
  });
  return filteredTasks;
}

export function filterUnscheduledTasks(tasks = []) {
  return tasks.filter(function (task) {
    return !task.isScheduled();
  });
}

class Task {
  constructor(
    id,
    name,
    stackId,
    description,
    order,
    owner,
    dueDate,
    color,
    deckId
  ) {
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
    this.color = color;
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
    let duration = Math.round((end - start) / msPerDay);
    this.setDurationInDescription(duration);
    this.end = this.calculateEnd(end);
    this.putToRemote();
  }
  setDurationInDescription(newDurationInDays) {
    this.setInDescription("d", newDurationInDays);
  }

  setProgressInDescription(newProgress) {
    this.setInDescription("p", newProgress);
  }

  setProgress(newProgress) {
    this.setProgressInDescription(newProgress);
    this.putToRemote();
  }

  setDependencyInDescription(task, newDependency) {
    this.setInDescription("w", newDependency);
  }
  setInDescription(letter, value) {
    let regex = new RegExp(letter + ":(.*?):" + letter);
    let newExp = `${letter}:${value}:${letter}`;
    let description = this.description;
    let ganttInfosStartIndex = description.match(ganttInfoDelimiter) ? description.match(ganttInfoDelimiter).index : description.length ;
    let ganttInfos = description.substring(ganttInfosStartIndex);
    if (! ganttInfos.startsWith(ganttInfoDelimiter)){
      ganttInfos = (' \n \n \n \n \n \n \n \n \n ' + ganttInfoDelimiter + " " + translate('doNotEdit', navigator.language || navigator.userLanguage)) + " " + ganttInfoDelimiter + "\n"  + ganttInfos;
    }
    if (ganttInfos.search(regex) !== -1) {
        ganttInfos = ganttInfos.replace(regex, newExp);
    } else {
        ganttInfos = ganttInfos + newExp + "\n";
    }
    this.description = description.substring(0, ganttInfosStartIndex) + ganttInfos;
  }

  isScheduled() {
    return !!this.end;
  }

  async putToRemote() {
    let requestData = {
      description: this.description,
      duedate: this.end,
      order: this.order,
      owner: this.owner,
      title: this.name,
      type: "plain",
    };

    let response = await fetch(
      conf.NC_URL +
        conf.BOARD_ENDPOINT +
        `/${this.deckId}/stacks/${this.stackId}/cards/${this.id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic " + getCredentials(),
        },
        body: JSON.stringify(requestData),
      }
    );
    if (response.status != 200) {
      setErrorMessage(response, "Could not update task");
    }
  }
}
