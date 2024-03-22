export function createTasks(data) {
    // put relevant task data into array that can then be attached to
    let tasks = [];
    let stacks = JSON.parse(data);
    for (let stack of stacks) {
        console.log(stack.cards);
        if (stack.cards) {
            for (let task of stack.cards) {
                if (task.duedate) {
                    //convert date due date to string if defined else date of the day
                    let refDate = new Date();
                    if (task.duedate) {
                        refDate = new Date(task.duedate);
                    }
                    let endDate =
                        refDate.getFullYear() +
                        "-" +
                        (refDate.getMonth() + 1) +
                        "-" +
                        refDate.getDate();

                    //Get duration in unix timestamp format of task in description if set between ||123564561321|| else set one day(86400) and class
                    let barClass = "bar-blue";
                    let duration = null;
                    let progression = 0;
                    let dependencies = "";

                    if (!duration || duration == -1) {
                        duration = 1;
                    }
                    refDate.setDate(refDate.getDate() - duration);
                    let startDate =
                        refDate.getFullYear() +
                        "-" +
                        (refDate.getMonth() + 1) +
                        "-" +
                        refDate.getDate();
                    tasksArray.push({
                        id: task.id.toString(),
                        name: task.title,
                        start: startDate,
                        end: endDate,
                        progress: progression,
                        custom_class: barClass,
                        refDate: refDate,
                        stack_id: task.stackId,
                        board_id: 6,
                        card_id: task.id,
                        card_description: task.description,
                        order: task.order,
                        dependencies: dependencies,
                    });
                }
            }
        }
    }

    if (tasksArray.length > 0) {
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
    }
}


function extractFromDescription(task, letter) {
    if (task.description.indexOf(`${letter}:`) !== -1) {
        return task.description.substring(
            task.description.indexOf(`${letter}:`) + 2,
            task.description.indexOf(`:${letter}`)
        );
    }
    return null;
}

function getDurationFromDescription(task){
    return extractFromDescription(task, 'd');
}

function getClassFromDescription(task){
    return extractFromDescription(task, 'c');
}

function getProgressFromDescription(task){
    return extractFromDescription(task, 'p');
}

function getDependenciesFromDescription(task){
    return extractFromDescription(task, 'w');
}

