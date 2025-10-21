# x86 Assembly Interpreter - Compatibility Guide

## Compatibility with Real x86 Assembly

This interpreter is designed as an **educational tool** for learning x86 assembly concepts, not as a full x86 emulator. Here's a detailed breakdown of compatibility:

## ✅ What Works (Compatible)

### Basic Instructions
- **Data Movement**: MOV, PUSH, POP work as expected
- **Arithmetic**: ADD, SUB, INC, DEC, MUL (simplified), DIV (simplified)
- **Logical**: AND, OR, XOR, NOT
- **Shifts**: SHL, SHR (SAL supported)
- **Comparison**: CMP, TEST
- **Control Flow**: JMP, conditional jumps (JE, JNE, JG, JL, etc.)
- **Functions**: CALL, RET
- **Other**: NOP, HLT

### Registers
- ✅ 32-bit registers (EAX, EBX, ECX, EDX, ESI, EDI, EBP, ESP)
- ✅ 16-bit registers (AX, BX, CX, DX, SI, DI, BP, SP)
- ✅ 8-bit registers (AL, AH, BL, BH, CL, CH, DL, DH)

### Flags
- ✅ Zero Flag (ZF)
- ✅ Sign Flag (SF)
- ✅ Carry Flag (CF)
- ✅ Overflow Flag (OF)

### Memory
- ✅ Basic memory addressing: `[eax]`, `[ebp+4]`, `[0x1000]`
- ✅ Stack operations (PUSH/POP)
- ✅ 64KB addressable space

### Programming Concepts
- ✅ Labels and jumps
- ✅ Loops
- ✅ Function calls with stack
- ✅ Basic algorithms (factorial, fibonacci, sorting, etc.)

## ⚠️ Limitations & Differences

### 1. **Simplified Instructions**
```assembly
; MUL behavior differs:
; Real x86: MUL operand -> EDX:EAX = EAX * operand (64-bit result)
; This interpreter: MUL dest, src -> dest = dest * src (simplified)

; DIV behavior differs:
; Real x86: DIV operand -> EAX = EDX:EAX / operand, EDX = remainder
; This interpreter: DIV operand -> EAX = EAX / operand, EDX = remainder
```

### 2. **Missing Instructions**
The interpreter doesn't support:
- ❌ IMUL (signed multiply with multiple forms)
- ❌ IDIV (signed division)
- ❌ LEA (load effective address)
- ❌ MOVSX, MOVZX (sign/zero extend)
- ❌ ROL, ROR, RCL, RCR (rotations)
- ❌ SAR (arithmetic right shift)
- ❌ LOOP, LOOPZ, LOOPNZ
- ❌ REP prefix instructions
- ❌ String instructions (MOVS, CMPS, SCAS, etc.)
- ❌ Bit manipulation (BT, BTS, BTR, BTC, BSF, BSR)
- ❌ Conditional moves (CMOV*)
- ❌ XCHG, CMPXCHG
- ❌ Floating-point instructions (FPU/x87)
- ❌ SSE/AVX instructions
- ❌ System instructions (LGDT, LIDT, etc.)

### 3. **Missing Flags**
- ❌ Parity Flag (PF)
- ❌ Auxiliary Carry Flag (AF)
- ❌ Interrupt Flag (IF)
- ❌ Direction Flag (DF)
- ❌ Trap Flag (TF)

### 4. **Simplified Memory Model**
```assembly
; Real x86 has segmentation:
mov ax, [ds:0x1000]  ; ❌ Not supported

; Real x86 has complex addressing with SIB bytes:
mov eax, [ebx + ecx*4 + 8]  ; ❌ Not supported

; This interpreter supports:
mov eax, [ebx]              ; ✅ Works
mov eax, [ebx + 4]          ; ✅ Works
mov eax, [0x1000]           ; ✅ Works
```

### 5. **No Operating System Interface**
```assembly
; Real Linux x86 syscalls:
mov eax, 4        ; sys_write
mov ebx, 1        ; stdout
mov ecx, msg      ; buffer
mov edx, 13       ; length
int 0x80          ; ❌ Won't work as in real Linux

; This interpreter's output (simplified):
mov eax, 1        ; output syscall
mov ebx, 42       ; value to output
int 0x80          ; ✅ Outputs "42" to output panel
```

### 6. **No Binary Compatibility**
- ❌ Cannot load compiled .exe, .elf, or .o files
- ❌ Cannot run machine code
- ✅ Only works with assembly source code (text)

### 7. **Simplified Calling Conventions**
```assembly
; This works, but doesn't enforce cdecl, stdcall, etc.:
push 10
call my_function
; You must manually clean up the stack
```

### 8. **Memory Limitations**
- Only 64KB of memory (vs. gigabytes in real systems)
- No memory protection
- No paging or virtual memory
- No segment registers (CS, DS, SS, ES, FS, GS)

### 9. **No Interrupts**
- Only INT 0x80 is partially simulated for output
- No real interrupt handling
- No BIOS/DOS interrupts (INT 0x10, INT 0x21, etc.)

## 📚 What Can You Learn?

### ✅ Great For:
1. **Learning x86 basics**: Understanding registers, flags, instructions
2. **Algorithm implementation**: Sorting, searching, recursion
3. **Control flow**: Loops, conditionals, jumps
4. **Stack operations**: Function calls, local variables
5. **Low-level programming concepts**: Bitwise operations, memory addressing
6. **Debugging assembly**: Step through code, watch registers change

### ✅ Example Programs That Work Well:
```assembly
; Fibonacci sequence
mov eax, 0
mov ebx, 1
mov ecx, 10

fib_loop:
mov edx, eax
add edx, ebx
mov eax, ebx
mov ebx, edx
dec ecx
jnz fib_loop
hlt

; Bubble sort (with array in memory)
; String length calculation
; GCD/LCM algorithms
; Simple state machines
```

### ❌ NOT Suitable For:
1. Running compiled programs from C/C++/Rust
2. Operating system development
3. BIOS/bootloader code
4. Real-world systems programming
5. Programs using advanced x86 features
6. Floating-point calculations
7. SIMD/vectorized operations
8. Multithreading

## 🔄 Porting Real x86 Code

If you want to port real x86 assembly to this interpreter:

### 1. **Replace Unsupported Instructions**
```assembly
; Real code:
lea eax, [ebx + 4]

; Interpreter equivalent:
mov eax, ebx
add eax, 4
```

### 2. **Simplify Memory Access**
```assembly
; Real code:
mov eax, [ebx + ecx*4]

; Interpreter: calculate manually
mov eax, ecx
shl eax, 2      ; multiply by 4
add eax, ebx
mov eax, [eax]  ; then load
```

### 3. **Adapt System Calls**
```assembly
; Real Linux:
mov eax, 1      ; sys_exit
mov ebx, 0      ; status code
int 0x80

; Interpreter:
hlt             ; just halt
```

### 4. **Remove Directives**
```assembly
; Real assembly:
section .data
section .text
global _start
_start:

; Interpreter: just write the code
mov eax, 10
```

## 🎯 Compatibility Score

| Feature | Compatibility | Notes |
|---------|---------------|-------|
| Basic arithmetic | 90% | MUL/DIV simplified |
| Logical operations | 100% | Full support |
| Control flow | 85% | No LOOP, REP |
| Stack operations | 90% | Basic PUSH/POP/CALL/RET |
| Memory access | 60% | Simplified addressing |
| Flags | 50% | Only 4 of 9+ flags |
| Instruction set | 30% | ~30 of 100+ instructions |
| System calls | 5% | Custom INT 0x80 only |
| Binary compatibility | 0% | Text only |

## 🎓 Conclusion

This interpreter is best viewed as a **learning sandbox** rather than a full emulator. It's excellent for:
- Understanding how x86 assembly works
- Practicing algorithm implementation
- Learning low-level programming concepts
- Debugging and visualizing execution

For real x86 development, use:
- **QEMU** or **Bochs**: Full system emulators
- **DOSBox**: For DOS programs
- **GDB**: For debugging real assembly
- **NASM/YASM + Linux/Windows**: For actual development

But for learning the fundamentals? This interpreter provides an accessible, visual, and interactive environment that makes x86 assembly approachable!
