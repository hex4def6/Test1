# x86 Assembly Interpreter

A browser-based x86 assembly interpreter that allows you to write, execute, and debug x86 assembly code directly in your web browser.

## Features

- **Full x86 Instruction Support**: Supports common x86 instructions including:
  - Data movement: MOV, PUSH, POP
  - Arithmetic: ADD, SUB, MUL, DIV, INC, DEC
  - Logical: AND, OR, XOR, NOT
  - Shift: SHL, SHR
  - Comparison: CMP, TEST
  - Control flow: JMP, JE, JNE, JG, JGE, JL, JLE, JA, JAE, JB, JBE
  - Function calls: CALL, RET
  - Other: NOP, HLT, INT

- **Register Support**:
  - 32-bit registers: EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP
  - 16-bit registers: AX, BX, CX, DX, SI, DI, BP, SP
  - 8-bit registers: AL, AH, BL, BH, CL, CH, DL, DH

- **Flags**: ZF (Zero), SF (Sign), CF (Carry), OF (Overflow)

- **Memory**: 64KB of addressable memory with stack support

- **Real-time Visualization**:
  - Register values with change highlighting
  - CPU flags status
  - Memory viewer with configurable range
  - Instruction list with current execution pointer
  - Step counter and status display

## How to Use

1. **Open the Interpreter**: Simply open `index.html` in a modern web browser (Chrome, Firefox, Edge, Safari)

2. **Write Assembly Code**: Enter your x86 assembly code in the text editor
   - Use semicolons (;) for comments
   - Use labels followed by colons (:) for jump targets

3. **Execute Code**:
   - **Run**: Execute the entire program
   - **Step**: Execute one instruction at a time
   - **Reset**: Clear the CPU state and restart

4. **Monitor Execution**:
   - Watch registers update in real-time
   - Track flag changes
   - View memory contents
   - See which instruction is currently executing

## Example Programs

### Simple Addition
```assembly
mov eax, 10
mov ebx, 20
add eax, ebx
hlt
```

### Program with Output
```assembly
; Calculate and output the sum of two numbers
mov eax, 25
mov ebx, 17
add eax, ebx       ; eax = 42

; Output the result
mov ebx, eax       ; move result to ebx
mov eax, 1         ; syscall 1 = output
int 0x80           ; output 42

; Output another value
mov ebx, 100
int 0x80           ; output 100

hlt
```

### Factorial Calculation with Output
```assembly
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
hlt               ; halt
```

### Loop Example
```assembly
; Count from 0 to 10
mov ecx, 0        ; counter = 0

loop_start:
inc ecx           ; counter++
cmp ecx, 10       ; if (counter == 10)
je loop_end       ; goto loop_end
jmp loop_start    ; loop

loop_end:
hlt
```

### Stack Example
```assembly
; Using the stack
mov eax, 100
push eax          ; push 100 onto stack
mov eax, 200
push eax          ; push 200 onto stack

pop ebx           ; ebx = 200
pop ecx           ; ecx = 100
hlt
```

## Syntax

### Instructions
```
opcode operand1, operand2
```

### Operand Types
- **Registers**: `eax`, `ebx`, `ax`, `al`, etc.
- **Immediate values**: `123`, `0x1A`, `-5`
- **Memory references**: `[eax]`, `[ebp+4]`, `[0x1000]`
- **Labels**: `loop_start`, `done`, etc.

### Comments
```assembly
; This is a comment
mov eax, 10  ; inline comment
```

### Labels
```assembly
start:
    mov eax, 1
    jmp start
```

### Output (INT 0x80)
To display values in the output section, use the INT 0x80 interrupt:
```assembly
; Set EAX = 1 for output syscall
; Set EBX = value to output
mov eax, 1
mov ebx, 42
int 0x80    ; outputs "42" to the output section
```

## Architecture

The interpreter consists of several modules:

- **cpu.js**: CPU emulation with registers and flags
- **memory.js**: Memory management system
- **parser.js**: Assembly code parser
- **executor.js**: Instruction execution engine
- **interpreter.js**: Main interpreter controller
- **ui.js**: User interface controller
- **style.css**: Styling and layout

## Limitations

- Simplified implementation of some complex instructions
- No segmentation or paging
- Limited interrupt support
- Maximum execution steps limited to prevent infinite loops (10,000 steps)
- Memory size limited to 64KB

## Browser Compatibility

Works on all modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari
- Opera

## License

MIT License

## Contributing

Feel free to submit issues and enhancement requests!
