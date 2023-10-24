
let useLocalStorage = true; // Set this to false to disable localStorage

function manipulateTimersInLocalStorage(action, timerData) {
  if (!useLocalStorage) {
    return;
  }

  let timers = getFromLocalStorage("timers");

  if (action === "add") {
    timers.push(timerData);
  } else if (action === "edit") {
    const timerIndex = timers.findIndex((timer) => timer.id === timerData.id);
    if (timerIndex !== -1) {
      timers[timerIndex] = timerData;
    }
  } else if (action === "delete") {
    timers = timers.filter((timer) => timer.id !== timerData.id);
  }

  storeTimersInLocalStorage(timers);
}

function storeTimersInLocalStorage(timers) {
  if (useLocalStorage) {
    localStorage.setItem("timers", JSON.stringify(timers));
  }
}

function getFromLocalStorage(key) {
  if (useLocalStorage) {
    const storedItems = localStorage.getItem(key);
    return storedItems ? JSON.parse(storedItems) : [];
  }
  return [];
}

// Initialize timers from localStorage on app load
function initializeTimersFromLocalStorage() {
  const timers = getFromLocalStorage("timers");
  const timerOrder = getFromLocalStorage("timerOrder")
  const now = Date.now()
  if (timerOrder) {
    timerOrder.forEach(timerId => {
        const timerData = timers.find(timer => timer.id === timerId);
        if (timerData) {
            if (timerData.duration > 0) {
                timerData.duration = timerData.initialDuration - ((now - timerData.creationTime) / 1000);
                if (timerData.duration <= 0) {
                    timerData.duration = 1;
                }
            }
          createTimerBar(timerData, false);
        }
      });
    } else { 
        timers.forEach(timerData => {
            timerData.duration = timerData.initialDuration - ((now - timerData.creationTime) / 1000);
            createTimerBar(timerData, false);
          });
    }
}

// Function to update the array of timer IDs
function updateTimerOrderInLocalStorage() {
    const timerIds = Array.from(timerList.querySelectorAll("li")).map(li => li.querySelector('.timer').id);
    localStorage.setItem('timerOrder', JSON.stringify(timerIds));
}

// Function to get the timer order from local storage
function getTimerOrderFromLocalStorage() {
    const timerIds = JSON.parse(localStorage.getItem('timerOrder'));
    return timerIds || [];
}

// Initialize the timer order
let timerOrder = getTimerOrderFromLocalStorage();



//funcition for responsiveness
function setScale() {
    const viewportWidth = window.innerWidth;
    const scale = viewportWidth < 650 ? (viewportWidth / 650) : 1;
    document.body.style.transform = `scale(${scale})`;
  }
  
  window.addEventListener('resize', setScale);
  setScale(); // Call it initially

// Function for the global timer
let previousTimestamp = null; // Variable to store the previous timestamp 

function globalTimer(timestamp) {
    if (activeTimers.length > 0) {
        // Request the next animation frame
        requestAnimationFrame(globalTimer);

        // Calculate the time elapsed since the last frame
        if (previousTimestamp === null) {
            previousTimestamp = timestamp;
        }
        const elapsedSeconds = (timestamp - previousTimestamp) / 1000; // Convert milliseconds to seconds

        // Check if at least 1 second has elapsed
        if (elapsedSeconds >= 1) {
            // Implement logic to update all active timers
            for (const timer of activeTimers) {
                // Decrease the remaining duration by elapsed time (1 second)
                timer.duration -= elapsedSeconds;
                    // Check if the timer should stop based on duration
                    if (timer.duration <= 0) {
                        stopTimer(timer);
                        // Move the timer to inactiveTimers
                        if (timer.html.classList.contains("ending")) {
                            timer.html.classList.remove("ending");
                        }
                        const index = activeTimers.findIndex(t => t.id === timer.id);
                        if (index !== -1) {
                            activeTimers.splice(index, 1)
                        }
                        inactiveTimers.push(timer)
                        manipulateTimersInLocalStorage("edit", timer)
                        startGlobalTimer()
                    // Check if the timer's duration is less than or equal to x minutes
                    } else if (timer.duration <= 50 && !timer.html.classList.contains("ending")) {
                        timer.html.classList.add("ending")
                    }
                // Update the timer display
                updateTimerDisplay(timer);

            }
            // Store the current timestamp as the previous timestamp for the next frame
            previousTimestamp = timestamp;
        }
    } else {
        previousTimestamp = null; 
    }
}


// Initialize the global timer
let globalTimerRunning = false; // Variable to track whether the global timer is running
const timerList = document.querySelector("ul");

const initSortableList = (e) => {
    e.preventDefault();
    const draggedTimer = timerList.querySelector(".dragging")
    //Getting all items except currently dragging and making an array with them
    const siblings = [...timerList.querySelectorAll("li:not(.dragging)")]

    //Finding closest sibling to insert before
    let closestNextSibling = siblings.find(sibling => {
        return e.clientY <= sibling.offsetTop + sibling.offsetHeight / 2;
    })

    // Inserting the dragged timer before the closestNextSibling
    timerList.insertBefore(draggedTimer, closestNextSibling)
    updateTimerOrderInLocalStorage()
}

timerList.addEventListener("dragover", initSortableList)
timerList.addEventListener("dragenter", e => e.preventDefault())

// Function to start or stop the global timer
function startGlobalTimer() {
    if (activeTimers.length > 0 && !globalTimerRunning) {
        // Start the global timer only if there are active timers and it's not already running
        globalTimerRunning = true;
        requestAnimationFrame(globalTimer); // Start the animation frame loop
    } else if (activeTimers.length === 0 && globalTimerRunning) {
        // Stop the global timer if there are no active timers
        globalTimerRunning = false;
        previousTimestamp = null; 
    }
}

// Function to update the display of a timer
function updateTimerDisplay(timer) {
    if (timer.remainingTimeElement) {
        timer.remainingTimeElement.textContent = formatTime(timer.duration);
        const progressRatio = timer.duration / timer.initialDuration
        timer.progressBar.style.width = `${progressRatio * 100}%`
    }
}

function stopTimer(timer) {
    // Set the remaining duration to 0
    timer.duration = 0;
    
    // Update the timer display to show "00:00:00"
    updateTimerDisplay(timer);
}

// Function to format time (e.g., convert seconds to HH:MM:SS format)
function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = seconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
//////GROUPS
// Define the possible timer group values
const timerGroups = [1, 2, 3];

// Initialize the current group index
let currentGroupNumber = 1;

//dragging 
let dragging = false

function createTimer(duration, timerClass) {
    const timestamp = Date.now();
    const timerId = `timer_${timestamp}`;
  
    const timer = {
      id: timerId,
      group: currentGroupNumber,
      class: timerClass,
      duration: duration,
      initialDuration: duration,
      creationTime: timestamp,
      remainingTimeElement: null,
      progressBar: null,
      html: null,
    };
    return timer;
  }

function createTimerBar(timer, newTimer) {

    // Create the timer bar HTML
    const timerBar = document.createElement("div");
    timerBar.classList.add("timer", timer.class);
    timerBar.id = timer.id;
    //
    timerBar.innerHTML = `<div class="button decrementTime">-</div><div class="bar"><div class="time-remaining">${formatTime(timer.duration)}</div><span></span></div><div class="button increment-time">+</div><div class="button timer-group"><span>${timer.group}</span></div><div class="button delete">×</div>`;

    //Store a reference to the .time-remaining element
    timer.remainingTimeElement = timerBar.querySelector(".time-remaining");

    //Store a reference to the progress bar
    timer.progressBar = timerBar.querySelector("span")
    timer.progressBar.style.width = `100%`
    

    //Set the timer's html property to the timerBar
    timer.html = timerBar;
    // Append the timer bar to the list
    const li = document.createElement("li");
    //li.draggable = true;
    li.addEventListener("dragstart", () => {
        dragging = true
        setTimeout(() => li.classList.add("dragging"), 0)
    })
    li.addEventListener("dragend", () => {
        dragging = false
        li.classList.remove("dragging")
    })
    li.appendChild(timerBar);

    const bar = timerBar.querySelector(".bar")
    bar.addEventListener("mouseover", (e) => {
        if (!dragging) {
            li.draggable = true;
        }
    })
    bar.addEventListener("mouseout", (e) => {
        if (!dragging && !li.classList.contains("dragging")) {
            li.draggable = false
        }
    })


    timerList.appendChild(li);

    const groupNumber = timerBar.querySelector(".timer-group span");
    // Add event listeners for the buttons
    //const decrementTimeButton = timerBar.querySelector(".decrement-time");
    //const incrementTimeButton = timerBar.querySelector(".increment-time");
    // Add event listeners for the buttons
    timerBar.querySelector(".timer-group").addEventListener("click", () => {
        const timerGroupNumber = parseInt(timer.group, 10);
        timer.group = (timerGroupNumber % 3) + 1;
        groupNumber.textContent = timer.group;
        currentGroupNumber = timer.group;
        manipulateTimersInLocalStorage("edit", timer)
    });

    const deleteButton = timerBar.querySelector(".delete");
    deleteButton.addEventListener("click", () => {
        // Handle delete button click
        li.remove(); // Remove the entire timer bar
        // Remove the timer from activeTimers
        let index = activeTimers.findIndex(timer => timer.id === timer.id);
        if (index !== -1) {
            activeTimers.splice(index, 1);
        } else if (index === -1) {
            index = inactiveTimers.findIndex(timer => timer.id === timer.id);
            if (index !== -1) {
                inactiveTimers.splice(index, 1)
            }
        }

        manipulateTimersInLocalStorage('delete', timer)
        updateTimerOrderInLocalStorage()
        startGlobalTimer();
    });

    // Add the timer to activeTimers
    activeTimers.push(timer);

    // Add the timer to localStorage
    if (newTimer) {
        manipulateTimersInLocalStorage('add', timer)
        updateTimerOrderInLocalStorage()
    }

    // Start the global timer if it's not running
    startGlobalTimer();
}

// Function to add event listeners to buttons
function addEventListenersToButtons(buttonSelector) {
    const buttons = document.querySelectorAll(buttonSelector);
    let timerGroup = null
    buttons.forEach(button => {
        button.addEventListener("click", (event) => {
            const clickedButton = event.currentTarget; // Get the clicked button
            const buttonGroup = clickedButton.classList[1];
            switch (buttonGroup) {
                case "harvest-btn":
                    timerGroup = "harvest-timer";
                    break;
                case "operations-btn":
                    timerGroup = "operations-timer";
                    break;
                case "dispatch-btn":
                    timerGroup = "dispatch-timer"
                    break;
                default:
                    timerGroup = "default-timer";

            }
            const dataMinutes = clickedButton.getAttribute("data-minutes"); // Fetch data-minutes attribute
            const duration = parseInt(dataMinutes, 10) * 60; // Convert to integer
            if (!isNaN(duration)) {
                const timerData = createTimer(duration, timerGroup); // Create a timer with the extracted duration
                createTimerBar(timerData, true); // Create a timer bar with the extracted duration
            }
        });
    });
}

const selectorIncrement = document.querySelector(".selector-increment")
const selectorDecrement = document.querySelector(".selector-decrement")
const selectorDisplay = document.querySelector(".selector");
const dispatchDisplay = document.querySelector(".dispatch-display span");
const dispatchButton = document.querySelector(".dispatch-btn");

let currentSelectorValue = 1;
let currentDispatchMinutes = 30

function updateDispatch() {
    //update selector display
    selectorDisplay.textContent = currentSelectorValue;
    currentDispatchMinutes = currentSelectorValue * 30;
    dispatchButton.setAttribute("data-minutes", currentDispatchMinutes.toString()); // Update data-minutes
    let dispatchDuration = parseInt(currentDispatchMinutes, 10) * 60; // Convert to integer
    dispatchDisplay.textContent = formatTime(dispatchDuration)

}

selectorDecrement.addEventListener("click", () => {
    if (currentSelectorValue > 1) {
        currentSelectorValue--;
        updateDispatch()
    }
})

selectorIncrement.addEventListener("click", () => {
    if (currentSelectorValue < 30) {
        currentSelectorValue++;
        updateDispatch()
    }
})

// Add event listeners to the Harvest and Operations buttons
addEventListenersToButtons(".harvest-btn");
addEventListenersToButtons(".operations-btn");
addEventListenersToButtons(".dispatch-btn")

const wateringButton = document.querySelector(".watering")
const waterableButtons = Array.from(document.querySelectorAll(".harvest-btn")).slice(0, 2)

let isWateringOn = false;

// Function to update the watering button state
function updateWateringButtonState() {
    isWateringOn = !isWateringOn;
    wateringButton.classList.toggle('watering-on', isWateringOn);
    wateringButton.classList.toggle('watering-off', !isWateringOn);
  }

// Add a click event listener to the "watering" button
wateringButton.addEventListener('click', () => {
    // Update the watering button state
    updateWateringButtonState();
    waterableButtons.forEach((waterableButton) => {
        const dataMinutes = waterableButton.getAttribute("data-minutes");
        const minutesToAdjust = isWateringOn? -30 : 30;
    
        // Ensure that dataMinutes is a valid number
        if (!isNaN(dataMinutes)) {
            const updatedMinutes = parseInt(dataMinutes, 10) + minutesToAdjust;
  
            // Update the data-minutes attribute
            waterableButton.setAttribute('data-minutes', updatedMinutes);
        }
    });
})

const arrow = document.querySelector(".arrow")
const arrowButton = document.querySelector(".arrow-button")
const groupsPanel = document.querySelector(".groups-panel-content")


arrowButton.addEventListener("click", () => {
    toggleGroupsPanel()
})


function toggleGroupsPanel() {
    //panelContent.classList.toggle('show');
    arrow.classList.toggle('expanded');
    groupsPanel.classList.toggle('show');
}

activeTimers = []
inactiveTimers = []


initializeTimersFromLocalStorage()