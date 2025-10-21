class Executor {
    constructor(cpu, memory) {
        this.cpu = cpu;
        this.memory = memory;
        this.halted = false;
        this.output = [];
        this.display = new Uint8Array(128 * 128); // 128x128 pixel display
        this.displayDirty = false;
        this.keyboardState = new Uint8Array(256); // Keyboard state buffer
    }

    reset() {
        this.halted = false;
        this.output = [];
        this.display.fill(0);
        this.displayDirty = true;
        this.keyboardState.fill(0);
    }

    setKeyState(keyCode, pressed) {
        if (keyCode >= 0 && keyCode < 256) {
            this.keyboardState[keyCode] = pressed ? 1 : 0;
            // Also write to memory at 0xF000 for direct access
            this.memory.writeByte(0xF000 + keyCode, pressed ? 1 : 0);
        }
    }

    getOperandValue(operand) {
        switch (operand.type) {
            case 'register':
                return this.cpu.getRegister(operand.value);

            case 'immediate':
                return operand.value;

            case 'memory':
                return this.getMemoryValue(operand.value);

            case 'label':
                throw new Error(`Label ${operand.value} not resolved`);

            default:
                throw new Error(`Unknown operand type: ${operand.type}`);
        }
    }

    getMemoryValue(memOp) {
        const address = this.getMemoryAddress(memOp);
        // For simplicity, assume 32-bit reads
        return this.memory.readDWord(address);
    }

    getMemoryAddress(memOp) {
        switch (memOp.type) {
            case 'register':
                return this.cpu.getRegister(memOp.register);

            case 'register_offset': {
                const baseAddr = this.cpu.getRegister(memOp.register);
                return (baseAddr + memOp.offset) >>> 0;
            }

            case 'direct':
                return memOp.address;

            default:
                throw new Error(`Unknown memory operand type: ${memOp.type}`);
        }
    }

    setOperandValue(operand, value) {
        switch (operand.type) {
            case 'register':
                this.cpu.setRegister(operand.value, value);
                break;

            case 'memory':
                this.setMemoryValue(operand.value, value);
                break;

            default:
                throw new Error(`Cannot set value for operand type: ${operand.type}`);
        }
    }

    setMemoryValue(memOp, value) {
        const address = this.getMemoryAddress(memOp);
        // For simplicity, assume 32-bit writes
        this.memory.writeDWord(address, value);
    }

    execute(instruction, labels = {}) {
        if (this.halted) return false;

        const { opcode, operands } = instruction;

        try {
            switch (opcode) {
                case 'mov':
                    this.execMov(operands);
                    break;

                case 'add':
                    this.execAdd(operands);
                    break;

                case 'sub':
                    this.execSub(operands);
                    break;

                case 'mul':
                    this.execMul(operands);
                    break;

                case 'div':
                    this.execDiv(operands);
                    break;

                case 'inc':
                    this.execInc(operands);
                    break;

                case 'dec':
                    this.execDec(operands);
                    break;

                case 'and':
                    this.execAnd(operands);
                    break;

                case 'or':
                    this.execOr(operands);
                    break;

                case 'xor':
                    this.execXor(operands);
                    break;

                case 'not':
                    this.execNot(operands);
                    break;

                case 'shl':
                case 'sal':
                    this.execShl(operands);
                    break;

                case 'shr':
                    this.execShr(operands);
                    break;

                case 'cmp':
                    this.execCmp(operands);
                    break;

                case 'test':
                    this.execTest(operands);
                    break;

                case 'jmp':
                    return this.execJmp(operands, labels);

                case 'je':
                case 'jz':
                    return this.execJe(operands, labels);

                case 'jne':
                case 'jnz':
                    return this.execJne(operands, labels);

                case 'jg':
                case 'jnle':
                    return this.execJg(operands, labels);

                case 'jge':
                case 'jnl':
                    return this.execJge(operands, labels);

                case 'jl':
                case 'jnge':
                    return this.execJl(operands, labels);

                case 'jle':
                case 'jng':
                    return this.execJle(operands, labels);

                case 'ja':
                case 'jnbe':
                    return this.execJa(operands, labels);

                case 'jae':
                case 'jnb':
                    return this.execJae(operands, labels);

                case 'jb':
                case 'jnae':
                    return this.execJb(operands, labels);

                case 'jbe':
                case 'jna':
                    return this.execJbe(operands, labels);

                case 'push':
                    this.execPush(operands);
                    break;

                case 'pop':
                    this.execPop(operands);
                    break;

                case 'call':
                    return this.execCall(operands, labels);

                case 'ret':
                    return this.execRet();

                case 'nop':
                    // No operation
                    break;

                case 'hlt':
                    this.halted = true;
                    break;

                case 'int':
                    this.execInt(operands);
                    break;

                default:
                    throw new Error(`Unknown instruction: ${opcode}`);
            }
        } catch (error) {
            throw new Error(`Error executing ${instruction.raw}: ${error.message}`);
        }

        return null; // No jump
    }

    execMov(operands) {
        const value = this.getOperandValue(operands[1]);
        this.setOperandValue(operands[0], value);
    }

    execAdd(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = (dest + src) | 0;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);

        // Set carry flag
        this.cpu.setCarryFlag((dest + src) > 0xFFFFFFFF);
    }

    execSub(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = (dest - src) | 0;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);

        // Set carry flag (borrow)
        this.cpu.setCarryFlag(dest < src);
    }

    execMul(operands) {
        // Simplified MUL: unsigned multiply
        // Full x86 has complex behavior with EDX:EAX
        const dest = this.getOperandValue(operands[0]);
        const src = operands.length > 1 ? this.getOperandValue(operands[1]) : this.cpu.getRegister('eax');
        const result = Math.imul(dest, src);
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
    }

    execDiv(operands) {
        // Simplified DIV
        const divisor = this.getOperandValue(operands[0]);
        if (divisor === 0) {
            throw new Error('Division by zero');
        }
        const dividend = this.cpu.getRegister('eax');
        const quotient = Math.floor(dividend / divisor);
        const remainder = dividend % divisor;
        this.cpu.setRegister('eax', quotient);
        this.cpu.setRegister('edx', remainder);
    }

    execInc(operands) {
        const value = this.getOperandValue(operands[0]);
        const result = (value + 1) | 0;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
    }

    execDec(operands) {
        const value = this.getOperandValue(operands[0]);
        const result = (value - 1) | 0;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
    }

    execAnd(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = dest & src;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
        this.cpu.setCarryFlag(0);
        this.cpu.setOverflowFlag(0);
    }

    execOr(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = dest | src;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
        this.cpu.setCarryFlag(0);
        this.cpu.setOverflowFlag(0);
    }

    execXor(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = dest ^ src;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
        this.cpu.setCarryFlag(0);
        this.cpu.setOverflowFlag(0);
    }

    execNot(operands) {
        const value = this.getOperandValue(operands[0]);
        const result = ~value;
        this.setOperandValue(operands[0], result);
    }

    execShl(operands) {
        const dest = this.getOperandValue(operands[0]);
        const count = this.getOperandValue(operands[1]);
        const result = dest << count;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
    }

    execShr(operands) {
        const dest = this.getOperandValue(operands[0]);
        const count = this.getOperandValue(operands[1]);
        const result = dest >>> count;
        this.setOperandValue(operands[0], result);
        this.cpu.updateFlags(result);
    }

    execCmp(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = (dest - src) | 0;
        this.cpu.updateFlags(result);
        this.cpu.setCarryFlag(dest < src);
    }

    execTest(operands) {
        const dest = this.getOperandValue(operands[0]);
        const src = this.getOperandValue(operands[1]);
        const result = dest & src;
        this.cpu.updateFlags(result);
        this.cpu.setCarryFlag(0);
        this.cpu.setOverflowFlag(0);
    }

    execJmp(operands, labels) {
        return this.resolveJumpTarget(operands[0], labels);
    }

    execJe(operands, labels) {
        if (this.cpu.flags.zf === 1) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJne(operands, labels) {
        if (this.cpu.flags.zf === 0) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJg(operands, labels) {
        if (this.cpu.flags.zf === 0 && this.cpu.flags.sf === this.cpu.flags.of) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJge(operands, labels) {
        if (this.cpu.flags.sf === this.cpu.flags.of) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJl(operands, labels) {
        if (this.cpu.flags.sf !== this.cpu.flags.of) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJle(operands, labels) {
        if (this.cpu.flags.zf === 1 || this.cpu.flags.sf !== this.cpu.flags.of) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJa(operands, labels) {
        if (this.cpu.flags.cf === 0 && this.cpu.flags.zf === 0) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJae(operands, labels) {
        if (this.cpu.flags.cf === 0) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJb(operands, labels) {
        if (this.cpu.flags.cf === 1) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execJbe(operands, labels) {
        if (this.cpu.flags.cf === 1 || this.cpu.flags.zf === 1) {
            return this.resolveJumpTarget(operands[0], labels);
        }
        return null;
    }

    execPush(operands) {
        const value = this.getOperandValue(operands[0]);
        this.memory.push(this.cpu, value);
    }

    execPop(operands) {
        const value = this.memory.pop(this.cpu);
        this.setOperandValue(operands[0], value);
    }

    execCall(operands, labels) {
        // Push return address (next instruction)
        this.memory.push(this.cpu, this.cpu.registers.eip + 1);
        return this.resolveJumpTarget(operands[0], labels);
    }

    execRet() {
        // Pop return address
        const returnAddr = this.memory.pop(this.cpu);
        return returnAddr;
    }

    execInt(operands) {
        const intNum = this.getOperandValue(operands[0]);

        // Simple interrupt handling
        if (intNum === 0x80) {
            // Text output (original functionality)
            const syscall = this.cpu.getRegister('eax');

            if (syscall === 1) {
                // sys_write
                const value = this.cpu.getRegister('ebx');
                this.output.push(value.toString());
            } else if (syscall === 4) {
                // sys_write with formatting
                const value = this.cpu.getRegister('ebx');
                this.output.push(String.fromCharCode(value));
            }
        } else if (intNum === 0x81) {
            // Set pixel: EAX=x, EBX=y, ECX=color
            const x = this.cpu.getRegister('eax');
            const y = this.cpu.getRegister('ebx');
            const color = this.cpu.getRegister('ecx');

            if (x >= 0 && x < 128 && y >= 0 && y < 128) {
                this.display[y * 128 + x] = color & 0xFF;
                this.displayDirty = true;
            }
        } else if (intNum === 0x82) {
            // Clear screen: ECX=color
            const color = this.cpu.getRegister('ecx');
            this.display.fill(color & 0xFF);
            this.displayDirty = true;
        } else if (intNum === 0x83) {
            // Read keyboard: EAX=key code, returns state in EAX
            const keyCode = this.cpu.getRegister('eax');
            if (keyCode >= 0 && keyCode < 256) {
                this.cpu.setRegister('eax', this.keyboardState[keyCode]);
            } else {
                this.cpu.setRegister('eax', 0);
            }
        }
    }

    resolveJumpTarget(operand, labels) {
        if (operand.type === 'label') {
            if (labels.hasOwnProperty(operand.value)) {
                return labels[operand.value];
            } else {
                throw new Error(`Undefined label: ${operand.value}`);
            }
        } else if (operand.type === 'immediate') {
            return operand.value;
        } else {
            throw new Error(`Invalid jump target type: ${operand.type}`);
        }
    }
}
