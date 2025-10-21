// UI Controller
class UI {
    constructor() {
        this.interpreter = new Interpreter();
        this.previousState = null;
        this.running = false;
        this.animationFrameId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.codeEditor = document.getElementById('codeEditor');
        this.runBtn = document.getElementById('runBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stepBtn = document.getElementById('stepBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.loadExampleBtn = document.getElementById('loadExample');
        this.loadGameBtn = document.getElementById('loadGameBtn');
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

        // Graphics display
        this.displayCanvas = document.getElementById('display');
        this.displayCtx = this.displayCanvas.getContext('2d');
        this.displayImageData = this.displayCtx.createImageData(128, 128);
    }

    attachEventListeners() {
        this.runBtn.addEventListener('click', () => this.run());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stepBtn.addEventListener('click', () => this.step());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.loadExampleBtn.addEventListener('click', () => this.loadExample());
        this.loadGameBtn.addEventListener('click', () => this.loadBrickBreaker());
        this.clearBtn.addEventListener('click', () => this.clear());
        this.refreshMemory.addEventListener('click', () => this.updateMemoryDisplay());

        // Keyboard input - prevent default for arrow keys and space
        document.addEventListener('keydown', (e) => {
            // Prevent default behavior for arrow keys and space (scrolling)
            if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
            this.interpreter.executor.setKeyState(e.keyCode, true);
        });

        document.addEventListener('keyup', (e) => {
            if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
                e.preventDefault();
            }
            this.interpreter.executor.setKeyState(e.keyCode, false);
        });
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

    loadBrickBreaker() {
        const game = `; Brick Breaker Game
; Use LEFT (37) and RIGHT (39) arrow keys to move paddle
; Ball bounces off walls, paddle, and bricks
; Remove all bricks to win!

; Memory layout:
; 0x1000: Ball X position
; 0x1004: Ball Y position
; 0x1008: Ball X velocity
; 0x100C: Ball Y velocity
; 0x1010: Paddle X position
; 0x1020-0x107F: Brick states (1=active, 0=destroyed)

; Initialize game
call init_game

game_loop:
    ; Clear screen (black)
    mov ecx, 0
    int 0x82

    ; Handle input
    call handle_input

    ; Update ball position
    call update_ball

    ; Draw everything
    call draw_bricks
    call draw_paddle
    call draw_ball

    ; Small delay loop
    mov ecx, 5000
    delay:
        dec ecx
        cmp ecx, 0
        jne delay

    ; Continue game loop
    jmp game_loop

; Initialize game state
init_game:
    ; Ball position (center)
    mov dword [0x1000], 64  ; Ball X
    mov dword [0x1004], 64  ; Ball Y
    mov dword [0x1008], 1   ; Ball velocity X
    mov dword [0x100C], 2   ; Ball velocity Y

    ; Paddle position (center bottom)
    mov dword [0x1010], 54  ; Paddle X

    ; Initialize bricks (6 rows, 8 columns)
    mov esi, 0x1020         ; Brick array
    mov ecx, 48             ; 6*8 bricks
    init_bricks_loop:
        mov byte [esi], 1   ; Active brick
        inc esi
        dec ecx
        cmp ecx, 0
        jne init_bricks_loop

    ret

; Handle keyboard input
handle_input:
    ; Check left arrow (37)
    mov eax, 37
    int 0x83
    cmp eax, 1
    jne check_right

    ; Move paddle left
    mov eax, [0x1010]
    sub eax, 3
    cmp eax, 0
    jl skip_left
    mov [0x1010], eax
    skip_left:

    check_right:
    ; Check right arrow (39)
    mov eax, 39
    int 0x83
    cmp eax, 1
    jne input_done

    ; Move paddle right
    mov eax, [0x1010]
    add eax, 3
    cmp eax, 108
    jg skip_right
    mov [0x1010], eax
    skip_right:

    input_done:
    ret

; Update ball position and check collisions
update_ball:
    ; Update X position
    mov eax, [0x1000]
    add eax, [0x1008]
    mov [0x1000], eax

    ; Check left/right walls
    cmp eax, 0
    jle bounce_x
    cmp eax, 127
    jge bounce_x
    jmp check_y

    bounce_x:
        ; Reverse X velocity
        mov eax, [0x1008]
        not eax
        inc eax
        mov [0x1008], eax
        ; Clamp position
        mov eax, [0x1000]
        cmp eax, 0
        jge clamp_right
        mov eax, 1
        mov [0x1000], eax
        jmp check_y
        clamp_right:
        cmp eax, 127
        jle check_y
        mov eax, 126
        mov [0x1000], eax

    check_y:
    ; Update Y position
    mov eax, [0x1004]
    add eax, [0x100C]
    mov [0x1004], eax

    ; Check top wall
    cmp eax, 0
    jle bounce_y_top
    jmp check_paddle

    bounce_y_top:
        mov eax, [0x100C]
        not eax
        inc eax
        mov [0x100C], eax
        mov eax, 1
        mov [0x1004], eax

    check_paddle:
    ; Check paddle collision
    mov eax, [0x1004]
    cmp eax, 115
    jl check_bricks

    ; Check if ball is above paddle X
    mov ebx, [0x1000]
    mov ecx, [0x1010]
    cmp ebx, ecx
    jl check_bricks

    ; Check if ball is within paddle width
    add ecx, 20
    cmp ebx, ecx
    jg check_bricks

    ; Bounce off paddle
    mov eax, [0x100C]
    not eax
    inc eax
    mov [0x100C], eax
    mov eax, 114
    mov [0x1004], eax

    check_bricks:
    ; Simple brick collision (check if ball in brick area)
    mov eax, [0x1004]
    cmp eax, 48
    jg update_done

    ; Calculate brick row/col
    mov ebx, [0x1000]
    shr ebx, 4              ; col = x / 16
    mov eax, [0x1004]
    shr eax, 3              ; row = y / 8

    ; Calculate brick index
    shl eax, 3              ; row * 8
    add eax, ebx            ; + col

    ; Check if valid brick
    cmp eax, 48
    jge update_done

    ; Check if brick is active
    mov esi, 0x1020
    add esi, eax
    mov cl, [esi]
    cmp cl, 0
    je update_done

    ; Destroy brick
    mov byte [esi], 0

    ; Bounce ball
    mov eax, [0x100C]
    not eax
    inc eax
    mov [0x100C], eax

    update_done:
    ret

; Draw bricks (6 rows x 8 columns)
draw_bricks:
    mov edi, 0              ; Brick index
    mov esi, 0x1020         ; Brick array

    draw_brick_loop:
        ; Check if brick is active
        mov al, [esi]
        cmp al, 0
        je skip_brick

        ; Calculate brick position
        mov eax, edi
        mov ebx, 8
        xor edx, edx
        div ebx                 ; EAX = row, EDX = col

        ; Draw brick (8x8 pixels)
        shl edx, 4              ; col * 16
        shl eax, 3              ; row * 8

        ; Draw a filled rectangle
        mov [0x2000], eax       ; Save row
        mov [0x2004], edx       ; Save col

        draw_brick_y:
            mov edx, [0x2004]
            draw_brick_x:
                mov eax, edx
                mov ebx, [0x2000]
                mov ecx, 2          ; Red
                int 0x81            ; Set pixel

                inc edx
                mov eax, [0x2004]
                add eax, 14
                cmp edx, eax
                jl draw_brick_x

            mov eax, [0x2000]
            inc eax
            mov [0x2000], eax
            mov ebx, [0x2000]
            sub ebx, eax
            add ebx, eax
            mov eax, ebx
            shr eax, 3
            shl eax, 3
            add eax, 7
            cmp ebx, eax
            jl draw_brick_y

    skip_brick:
        inc esi
        inc edi
        cmp edi, 48
        jl draw_brick_loop

    ret

; Draw paddle
draw_paddle:
    mov esi, [0x1010]       ; Paddle X
    mov edi, 120            ; Paddle Y

    mov ecx, 0
    paddle_loop:
        mov eax, esi
        add eax, ecx
        mov ebx, edi
        mov ecx, 1              ; White
        int 0x81

        mov ebx, edi
        inc ebx
        int 0x81

        mov ebx, edi
        add ebx, 2
        int 0x81

        mov ecx, ecx
        inc ecx
        cmp ecx, 20
        jl paddle_loop

    ret

; Draw ball
draw_ball:
    mov eax, [0x1000]
    mov ebx, [0x1004]
    mov ecx, 5              ; Yellow
    int 0x81

    ; Draw 3x3 ball
    dec eax
    int 0x81
    inc eax
    inc eax
    int 0x81
    dec eax

    dec ebx
    int 0x81
    dec eax
    int 0x81
    inc eax
    inc eax
    int 0x81

    ret
`;
        this.codeEditor.value = game;
        this.updateStatus('Brick Breaker game loaded! Use arrow keys to play.', 'success');
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

            // Stop if already running
            if (this.running) {
                this.stopRunning();
                return;
            }

            this.interpreter.load(code);
            this.updateInstructionsDisplay();

            // Check if this is a game loop (contains infinite loop)
            if (code.includes('game_loop:') || code.includes('jmp game_loop')) {
                // Run as continuous game loop
                this.running = true;
                this.runBtn.style.display = 'none';
                this.pauseBtn.style.display = 'inline-block';
                this.runGameLoop();
                this.updateStatus('Game running... Click Pause to pause or Reset to stop', 'success');
            } else {
                // Run normally
                const result = this.interpreter.run();
                this.updateDisplay();
                this.updateStatus(`Execution completed in ${result.finalState.stepCount} steps`, 'success');
            }
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, 'error');
            console.error(error);
            this.stopRunning();
        }
    }

    pause() {
        if (this.running) {
            this.running = false;
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }
            this.pauseBtn.textContent = 'Resume';
            this.updateStatus('Game paused. Click Resume to continue', 'info');
        } else {
            // Resume
            this.running = true;
            this.pauseBtn.textContent = 'Pause';
            this.runGameLoop();
            this.updateStatus('Game resumed', 'success');
        }
    }

    runGameLoop() {
        if (!this.running) return;

        try {
            // Execute a batch of instructions per frame (for smooth gameplay)
            for (let i = 0; i < 500; i++) {
                if (this.interpreter.isDone()) {
                    this.stopRunning();
                    this.updateStatus('Game ended', 'info');
                    return;
                }

                const result = this.interpreter.step();
                if (result.done) {
                    this.stopRunning();
                    this.updateStatus('Game ended', 'info');
                    return;
                }
            }

            // Update display
            this.updateDisplay();

            // Continue loop
            this.animationFrameId = requestAnimationFrame(() => this.runGameLoop());
        } catch (error) {
            this.updateStatus(`Error: ${error.message}`, 'error');
            console.error(error);
            this.stopRunning();
        }
    }

    stopRunning() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.runBtn.style.display = 'inline-block';
        this.pauseBtn.style.display = 'none';
        this.pauseBtn.textContent = 'Pause';
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
        this.stopRunning();
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
        this.updateGraphicsDisplay();
    }

    updateGraphicsDisplay() {
        if (!this.interpreter.executor.displayDirty) return;

        const display = this.interpreter.executor.display;
        const imageData = this.displayImageData;

        // Simple 16-color palette
        const palette = [
            [0, 0, 0],       // 0: Black
            [255, 255, 255], // 1: White
            [255, 0, 0],     // 2: Red
            [0, 255, 0],     // 3: Green
            [0, 0, 255],     // 4: Blue
            [255, 255, 0],   // 5: Yellow
            [255, 0, 255],   // 6: Magenta
            [0, 255, 255],   // 7: Cyan
            [128, 128, 128], // 8: Gray
            [192, 192, 192], // 9: Light Gray
            [128, 0, 0],     // 10: Dark Red
            [0, 128, 0],     // 11: Dark Green
            [0, 0, 128],     // 12: Dark Blue
            [128, 128, 0],   // 13: Olive
            [128, 0, 128],   // 14: Purple
            [0, 128, 128]    // 15: Teal
        ];

        for (let y = 0; y < 128; y++) {
            for (let x = 0; x < 128; x++) {
                const pixelIndex = y * 128 + x;
                const colorIndex = display[pixelIndex] % 16;
                const color = palette[colorIndex];
                const dataIndex = pixelIndex * 4;

                imageData.data[dataIndex] = color[0];     // R
                imageData.data[dataIndex + 1] = color[1]; // G
                imageData.data[dataIndex + 2] = color[2]; // B
                imageData.data[dataIndex + 3] = 255;      // A
            }
        }

        this.displayCtx.putImageData(imageData, 0, 0);
        this.interpreter.executor.displayDirty = false;
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

            const value = document.createElement('input');
            value.type = 'text';
            value.className = 'register-value editable';
            value.value = '0x' + state.registers[reg].toString(16).toUpperCase().padStart(8, '0');
            value.dataset.register = reg;

            // Edit register on blur
            value.addEventListener('blur', (e) => {
                try {
                    const newValue = parseInt(e.target.value, 16);
                    if (!isNaN(newValue)) {
                        this.interpreter.cpu.setRegister(reg, newValue);
                        this.updateDisplay();
                    } else {
                        e.target.value = '0x' + state.registers[reg].toString(16).toUpperCase().padStart(8, '0');
                    }
                } catch (error) {
                    console.error('Error setting register:', error);
                    e.target.value = '0x' + state.registers[reg].toString(16).toUpperCase().padStart(8, '0');
                }
            });

            // Enter key also saves
            value.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.target.blur();
                }
            });

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
                    const byteAddress = memoryView[i + j].address;
                    const byteValue = memoryView[i + j].value;

                    const byte = document.createElement('input');
                    byte.type = 'text';
                    byte.className = 'memory-byte editable';
                    byte.maxLength = 2;
                    byte.value = byteValue.toString(16).toUpperCase().padStart(2, '0');
                    byte.dataset.address = byteAddress;

                    if (byteValue === 0) {
                        byte.classList.add('zero');
                    }

                    // Edit memory on blur
                    byte.addEventListener('blur', (e) => {
                        try {
                            const newValue = parseInt(e.target.value, 16);
                            if (!isNaN(newValue) && newValue >= 0 && newValue <= 255) {
                                this.interpreter.memory.writeByte(byteAddress, newValue);
                                this.updateMemoryDisplay();
                            } else {
                                e.target.value = byteValue.toString(16).toUpperCase().padStart(2, '0');
                            }
                        } catch (error) {
                            console.error('Error setting memory:', error);
                            e.target.value = byteValue.toString(16).toUpperCase().padStart(2, '0');
                        }
                    });

                    // Enter key also saves
                    byte.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter') {
                            e.target.blur();
                        }
                    });

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
