// UI Controller
class UI {
    constructor() {
        this.interpreter = new Interpreter();
        this.previousState = null;
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.codeEditor = document.getElementById('codeEditor');
        this.runBtn = document.getElementById('runBtn');
        this.stepBtn = document.getElementById('stepBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadExampleBtn = document.getElementById('loadExample');
        this.clearBtn = document.getElementById('clearBtn');
        this.registersGrid = document.getElementById('registersGrid');
        this.flagsGrid = document.getElementById('flagsGrid');
        this.output = document.getElementById('output');
        this.memoryDisplay = document.getElementById('memoryDisplay');
        this.instructionsDisplay = document.getElementById('instructionsDisplay');
        this.statusMessage = document.getElementById('statusMessage');
        this.stepCounter = document.getElementById('stepCounter');
        this.memoryStart = document.getElementById('memoryStart');
        this.memoryLength = document.getElementById('memoryLength');
        this.refreshMemory = document.getElementById('refreshMemory');
    }

    attachEventListeners() {
        this.runBtn.addEventListener('click', () => this.run());
        this.stepBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.refreshMemory.addEventListener('click', () => this.updateMemoryDisplay());
    }

    loadExample() {
        const example = `; Example: Factorial calculation with output
; Calculate 5! and output the result

mov ecx, 5        ; n = 5
mov eax, 1        ; result = 1

factorial:
cmp ecx, 1        ; if (n <= 1)
jle done          ; goto done
mul eax, ecx      ; result *= n
dec ecx           ; n--
jmp factorial     ; loop

done:
; Output the result (120)
mov ebx, eax      ; move result to ebx
mov eax, 1        ; syscall 1 = output
int 0x80          ; output result

; Also output some other values
mov ebx, 999      ; output 999
int 0x80

mov ebx, 42       ; output 42
int 0x80

hlt               ; halt
`;
        this.codeEditor.value = example;
        this.updateStatus('Example loaded', 'info');
    }

    clear() {
        this.codeEditor.value = '';
        this.reset();
        this.updateStatus('Editor cleared', 'info');
    }

    run() {
        try {
            const code = this.codeEditor.value;
            if (!code.trim()) {
                this.updateStatus('No code to execute', 'warning');
                return;
            }

            this.interpreter.load(code);
            this.updateInstructionsDisplay();

            const result = this.interpreter.run();

            this.updateDisplay();
            this.updateStatus(`Execution completed in ${result.finalState.stepCount} steps`, 'success');
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, 'error');
            console.error(error);
        }
    }

    step() {
        try {
            const code = this.codeEditor.value;
            if (!code.trim()) {
                this.updateStatus('No code to execute', 'warning');
                return;
            }

            // Load code if not already loaded
            if (this.interpreter.getInstructions().length === 0) {
                this.interpreter.load(code);
                this.updateInstructionsDisplay();
            }

            if (this.interpreter.isDone()) {
                this.updateStatus('Execution finished', 'info');
                return;
            }

            const result = this.interpreter.step();
            this.updateDisplay();

            if (result.done) {
                if (result.halted) {
                    this.updateStatus('Program halted', 'success');
                } else {
                    this.updateStatus('Execution finished', 'success');
                }
            } else {
                this.updateStatus(`Executed: ${result.instruction}`, 'info');
            }
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, 'error');
            console.error(error);
        }
    }

    reset() {
        this.interpreter.reset();
        this.previousState = null;
        this.updateDisplay();
        this.updateInstructionsDisplay();
        this.updateStatus('Interpreter reset', 'info');
    }

    updateDisplay() {
        this.updateRegistersDisplay();
        this.updateFlagsDisplay();
        this.updateOutputDisplay();
        this.updateMemoryDisplay();
        this.updateInstructionsDisplay();
        this.updateStepCounter();
    }

    updateRegistersDisplay() {
        const state = this.interpreter.getState();
        const registers = ['eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp'];

        this.registersGrid.innerHTML = '';

        registers.forEach(reg => {
            const div = document.createElement('div');
            div.className = 'register-item';

            if (this.previousState &&
                this.previousState.registers[reg] !== state.registers[reg]) {
                div.classList.add('changed');
            }

            const name = document.createElement('span');
            name.className = 'register-name';
            name.textContent = reg.toUpperCase();

            const value = document.createElement('span');
            value.className = 'register-value';
            value.textContent = '0x' + state.registers[reg].toString(16).toUpperCase().padStart(8, '0');

            div.appendChild(name);
            div.appendChild(value);
            this.registersGrid.appendChild(div);
        });

        this.previousState = JSON.parse(JSON.stringify(state));
    }

    updateFlagsDisplay() {
        const flags = this.interpreter.cpu.flags;
        const flagNames = ['zf', 'sf', 'cf', 'of'];

        this.flagsGrid.innerHTML = '';

        flagNames.forEach(flag => {
            const div = document.createElement('div');
            div.className = 'flag-item';
            div.classList.add(flags[flag] ? 'set' : 'clear');

            const name = document.createElement('div');
            name.className = 'flag-name';
            name.textContent = flag.toUpperCase();

            const value = document.createElement('div');
            value.className = 'flag-value';
            value.textContent = flags[flag];

            div.appendChild(name);
            div.appendChild(value);
            this.flagsGrid.appendChild(div);
        });
    }

    updateOutputDisplay() {
        const output = this.interpreter.executor.output;
        if (output.length > 0) {
            this.output.textContent = output.join(' ');
        } else {
            this.output.textContent = '';
        }
    }

    updateMemoryDisplay() {
        try {
            const startAddr = parseInt(this.memoryStart.value, 16) || 0;
            const length = parseInt(this.memoryLength.value) || 64;

            const memoryView = this.interpreter.getMemoryView(startAddr, length);

            this.memoryDisplay.innerHTML = '';

            // Group by 16 bytes per row
            for (let i = 0; i < memoryView.length; i += 16) {
                const row = document.createElement('div');
                row.className = 'memory-row';

                const address = document.createElement('span');
                address.className = 'memory-address';
                address.textContent = '0x' + memoryView[i].address.toString(16).toUpperCase().padStart(4, '0') + ':';

                const values = document.createElement('span');
                values.className = 'memory-values';

                for (let j = 0; j < 16 && (i + j) < memoryView.length; j++) {
                    const byte = document.createElement('span');
                    byte.className = 'memory-byte';
                    const byteValue = memoryView[i + j].value;

                    if (byteValue === 0) {
                        byte.classList.add('zero');
                    }

                    byte.textContent = byteValue.toString(16).toUpperCase().padStart(2, '0');
                    values.appendChild(byte);
                }

                row.appendChild(address);
                row.appendChild(values);
                this.memoryDisplay.appendChild(row);
            }
        } catch (error) {
            console.error('Error updating memory display:', error);
        }
    }

    updateInstructionsDisplay() {
        const instructions = this.interpreter.getInstructions();
        const currentIndex = this.interpreter.currentInstruction;

        this.instructionsDisplay.innerHTML = '';

        if (instructions.length === 0) {
            this.instructionsDisplay.innerHTML = '<div style="color: #6c757d; padding: 10px;">No instructions loaded</div>';
            return;
        }

        instructions.forEach((instruction, index) => {
            const div = document.createElement('div');
            div.className = 'instruction-line';

            if (index === currentIndex && !this.interpreter.isDone()) {
                div.classList.add('current');
            } else if (index < currentIndex) {
                div.classList.add('executed');
            }

            const lineNum = document.createElement('span');
            lineNum.className = 'instruction-number';
            lineNum.textContent = index.toString().padStart(3, '0');

            const code = document.createElement('span');
            code.className = 'instruction-code';
            code.textContent = instruction.raw;

            div.appendChild(lineNum);
            div.appendChild(code);
            this.instructionsDisplay.appendChild(div);
        });

        // Scroll to current instruction
        const currentElement = this.instructionsDisplay.querySelector('.current');
        if (currentElement) {
            currentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    updateStepCounter() {
        const state = this.interpreter.getState();
        this.stepCounter.textContent = `Steps: ${state.stepCount}`;
    }

    updateStatus(message, type = 'info') {
        this.statusMessage.textContent = message;
        this.statusMessage.style.color = {
            'info': '#495057',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545'
        }[type] || '#495057';
    }
}

// Initialize UI when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.ui = new UI();
});
