// Process class to store process information
class Process {
    constructor(id, arrivalTime, burstTime, priority = 0) {
        this.id = id;
        this.arrivalTime = arrivalTime;
        this.burstTime = burstTime;
        this.priority = priority;
        this.remainingTime = burstTime;
        this.completionTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.startTime = -1;  // Track when process first starts
    }

    reset() {
        this.remainingTime = this.burstTime;
        this.completionTime = 0;
        this.turnaroundTime = 0;
        this.waitingTime = 0;
        this.startTime = -1;
    }
}

// Example process sets
const exampleSets = {
    set1: {
        processes: [
            { arrivalTime: 0, burstTime: 5, priority: 2 },
            { arrivalTime: 1, burstTime: 3, priority: 1 },
            { arrivalTime: 2, burstTime: 4, priority: 3 }
        ]
    },
    set2: {
        processes: [
            { arrivalTime: 0, burstTime: 8, priority: 3 },
            { arrivalTime: 2, burstTime: 4, priority: 1 },
            { arrivalTime: 4, burstTime: 2, priority: 2 },
            { arrivalTime: 6, burstTime: 1, priority: 4 }
        ]
    }
};

// Scheduling algorithms
const schedulingAlgorithms = {
    fcfs(processes) {
        processes.sort((a, b) => a.arrivalTime - b.arrivalTime);
        let currentTime = 0;
        const timeline = [];

        processes.forEach(process => {
            if (currentTime < process.arrivalTime) {
                currentTime = process.arrivalTime;
            }
            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        });

        return timeline;
    },

    sjf(processes) {
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes];

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                currentTime = unfinishedProcesses[0].arrivalTime;
                continue;
            }

            readyQueue.sort((a, b) => a.burstTime - b.burstTime);
            const process = readyQueue.shift();
            
            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        }

        return timeline;
    },

    srtf(processes) {
        processes.forEach(p => p.reset());
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes];
        let currentProcess = null;
        let lastProcessId = null;
        const completedProcesses = new Set();

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0 || currentProcess) {
            // Add newly arrived processes to ready queue
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            // Sort ready queue by remaining time
            readyQueue.sort((a, b) => a.remainingTime - b.remainingTime);

            // Select process with shortest remaining time
            if (!currentProcess && readyQueue.length > 0) {
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            } else if (readyQueue.length > 0 && readyQueue[0].remainingTime < currentProcess.remainingTime) {
                readyQueue.push(currentProcess);
                currentProcess = readyQueue.shift();
                if (currentProcess.startTime === -1) currentProcess.startTime = currentTime;
            }

            if (currentProcess) {
                if (lastProcessId !== currentProcess.id) {
                    timeline.push({ processId: currentProcess.id, startTime: currentTime, endTime: currentTime + 1 });
                } else {
                    timeline[timeline.length - 1].endTime = currentTime + 1;
                }
                lastProcessId = currentProcess.id;
                currentProcess.remainingTime--;

                if (currentProcess.remainingTime === 0) {
                    currentProcess.completionTime = currentTime + 1;
                    currentProcess.turnaroundTime = currentProcess.completionTime - currentProcess.arrivalTime;
                    currentProcess.waitingTime = currentProcess.turnaroundTime - currentProcess.burstTime;
                    completedProcesses.add(currentProcess.id);
                    currentProcess = null;
                }
            }

            currentTime++;
        }

        return timeline;
    },

    rr(processes, quantum) {
        processes.forEach(p => p.reset());
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes];
        const completedProcesses = new Set();

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            // Add newly arrived processes to ready queue
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                currentTime = unfinishedProcesses[0].arrivalTime;
                continue;
            }

            const process = readyQueue.shift();
            if (process.startTime === -1) process.startTime = currentTime;
            
            const executeTime = Math.min(quantum, process.remainingTime);
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + executeTime });
            
            currentTime += executeTime;
            process.remainingTime -= executeTime;

            // Check for new arrivals during this time quantum
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (process.remainingTime > 0) {
                readyQueue.push(process);
            } else {
                process.completionTime = currentTime;
                process.turnaroundTime = process.completionTime - process.arrivalTime;
                process.waitingTime = process.turnaroundTime - process.burstTime;
                completedProcesses.add(process.id);
            }
        }

        return timeline;
    },

    priority(processes) {
        const timeline = [];
        const readyQueue = [];
        let currentTime = 0;
        const unfinishedProcesses = [...processes];

        while (unfinishedProcesses.length > 0 || readyQueue.length > 0) {
            while (unfinishedProcesses.length > 0 && unfinishedProcesses[0].arrivalTime <= currentTime) {
                readyQueue.push(unfinishedProcesses.shift());
            }

            if (readyQueue.length === 0) {
                currentTime = unfinishedProcesses[0].arrivalTime;
                continue;
            }

            readyQueue.sort((a, b) => a.priority - b.priority);
            const process = readyQueue.shift();
            
            if (process.startTime === -1) process.startTime = currentTime;
            timeline.push({ processId: process.id, startTime: currentTime, endTime: currentTime + process.burstTime });
            currentTime += process.burstTime;
            process.completionTime = currentTime;
            process.turnaroundTime = process.completionTime - process.arrivalTime;
            process.waitingTime = process.turnaroundTime - process.burstTime;
        }

        return timeline;
    }
};

// UI handling
document.addEventListener('DOMContentLoaded', () => {
    const algorithmSelect = document.getElementById('algorithm');
    const processCountInput = document.getElementById('process-count');
    const processTableBody = document.getElementById('process-table-body');
    const calculateButton = document.getElementById('calculate');
    const resultsSection = document.getElementById('results');
    const quantumInput = document.getElementById('quantum-input');
    const priorityColumns = document.getElementsByClassName('priority-column');
    const exampleSetSelect = document.getElementById('example-set');

    function updateProcessTable() {
        const count = parseInt(processCountInput.value);
        processTableBody.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>P${i + 1}</td>
                <td><input type="number" class="input-field arrival-time" min="0" value="0"></td>
                <td><input type="number" class="input-field burst-time" min="1" value="1"></td>
                ${algorithmSelect.value === 'priority' ? 
                    `<td><input type="number" class="input-field priority-value" min="1" value="1"></td>` : 
                    '<td class="priority-column hidden"></td>'}
            `;
            processTableBody.appendChild(row);
        }
    }

    function loadExampleSet(setName) {
        if (!setName) return;
        
        const set = exampleSets[setName];
        if (!set) return;

        processCountInput.value = set.processes.length;
        updateProcessTable();

        const rows = processTableBody.getElementsByTagName('tr');
        set.processes.forEach((process, index) => {
            const row = rows[index];
            row.querySelector('.arrival-time').value = process.arrivalTime;
            row.querySelector('.burst-time').value = process.burstTime;
            const priorityInput = row.querySelector('.priority-value');
            if (priorityInput) {
                priorityInput.value = process.priority;
            }
        });
    }

    function togglePriorityColumn() {
        const isPriority = algorithmSelect.value === 'priority';
        Array.from(priorityColumns).forEach(col => {
            col.classList.toggle('hidden', !isPriority);
        });
        updateProcessTable();
    }

    function toggleQuantumInput() {
        quantumInput.classList.toggle('hidden', algorithmSelect.value !== 'rr');
    }

    function getProcesses() {
        const processes = [];
        const rows = processTableBody.getElementsByTagName('tr');
        
        for (let i = 0; i < rows.length; i++) {
            const arrivalTime = parseInt(rows[i].querySelector('.arrival-time').value);
            const burstTime = parseInt(rows[i].querySelector('.burst-time').value);
            const priority = rows[i].querySelector('.priority-value') ? 
                parseInt(rows[i].querySelector('.priority-value').value) : 0;
            
            processes.push(new Process(i + 1, arrivalTime, burstTime, priority));
        }
        
        return processes;
    }

    function displayResults(processes, timeline) {
        resultsSection.classList.remove('hidden');
        
        // Display Gantt chart
        const ganttContainer = document.getElementById('gantt-container');
        const ganttTimeline = document.getElementById('gantt-timeline');
        ganttContainer.innerHTML = '';
        ganttTimeline.innerHTML = '';
        
        timeline.forEach(({ processId, startTime, endTime }) => {
            const block = document.createElement('div');
            block.className = 'gantt-block';
            block.style.width = `${(endTime - startTime) * 40}px`;
            block.textContent = `P${processId}`;
            ganttContainer.appendChild(block);
        });

        // Add timeline markers
        const lastEndTime = timeline[timeline.length - 1].endTime;
        for (let i = 0; i <= lastEndTime; i++) {
            const mark = document.createElement('div');
            mark.className = 'timeline-mark';
            mark.textContent = i;
            ganttTimeline.appendChild(mark);
        }

        // Display metrics table
        const metricsTableBody = document.getElementById('metrics-table-body');
        metricsTableBody.innerHTML = '';
        
        let totalCT = 0, totalTAT = 0, totalWT = 0;
        
        processes.forEach(process => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>P${process.id}</td>
                <td>${process.completionTime}</td>
                <td>${process.turnaroundTime}</td>
                <td>${process.waitingTime}</td>
            `;
            metricsTableBody.appendChild(row);
            
            totalCT += process.completionTime;
            totalTAT += process.turnaroundTime;
            totalWT += process.waitingTime;
        });

        // Display averages
        document.getElementById('avg-ct').textContent = (totalCT / processes.length).toFixed(2);
        document.getElementById('avg-tat').textContent = (totalTAT / processes.length).toFixed(2);
        document.getElementById('avg-wt').textContent = (totalWT / processes.length).toFixed(2);
    }

    // Event listeners
    algorithmSelect.addEventListener('change', () => {
        togglePriorityColumn();
        toggleQuantumInput();
    });

    processCountInput.addEventListener('change', updateProcessTable);

    exampleSetSelect.addEventListener('change', (e) => {
        loadExampleSet(e.target.value);
    });

    calculateButton.addEventListener('click', () => {
        const processes = getProcesses();
        const algorithm = algorithmSelect.value;
        let timeline;

        if (algorithm === 'rr') {
            const quantum = parseInt(document.getElementById('time-quantum').value);
            timeline = schedulingAlgorithms[algorithm](processes, quantum);
        } else {
            timeline = schedulingAlgorithms[algorithm](processes);
        }

        displayResults(processes, timeline);
    });

    // Initial setup
    updateProcessTable();
    togglePriorityColumn();
    toggleQuantumInput();
});