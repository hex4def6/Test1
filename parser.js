class Parser {
    parse(code) {
        const lines = code.split('\n');
        const instructions = [];
        const labels = {};

        // First pass: collect labels
        let lineNumber = 0;
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Remove comments
            const commentIndex = line.indexOf(';');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex).trim();
            }

            if (!line) continue;

            // Check for labels
            if (line.endsWith(':')) {
                const label = line.substring(0, line.length - 1).trim();
                labels[label] = lineNumber;
                continue;
            }

            lineNumber++;
        }

        // Second pass: parse instructions
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            // Remove comments
            const commentIndex = line.indexOf(';');
            if (commentIndex !== -1) {
                line = line.substring(0, commentIndex).trim();
            }

            if (!line || line.endsWith(':')) continue;

            const instruction = this.parseLine(line, i + 1);
            if (instruction) {
                instructions.push(instruction);
            }
        }

        return { instructions, labels };
    }

    parseLine(line, lineNumber) {
        const parts = line.split(/\s+/);
        const opcode = parts[0].toLowerCase();
        const operands = parts.slice(1).join(' ').split(',').map(op => op.trim()).filter(op => op);

        return {
            opcode,
            operands: operands.map(op => this.parseOperand(op)),
            lineNumber,
            raw: line
        };
    }

    parseOperand(operand) {
        operand = operand.trim();

        // Remove size specifiers (byte, word, dword, qword)
        let size = null;
        const sizeMatch = operand.match(/^(byte|word|dword|qword)\s+(.+)$/i);
        if (sizeMatch) {
            size = sizeMatch[1].toLowerCase();
            operand = sizeMatch[2].trim();
        }

        // Check if it's a register
        if (this.isRegister(operand)) {
            return {
                type: 'register',
                value: operand.toLowerCase(),
                size
            };
        }

        // Check if it's a memory reference [...]
        if (operand.startsWith('[') && operand.endsWith(']')) {
            const inner = operand.substring(1, operand.length - 1).trim();
            return {
                type: 'memory',
                value: this.parseMemoryOperand(inner),
                size
            };
        }

        // Check if it's a hexadecimal immediate value
        if (operand.match(/^0x[0-9a-f]+$/i)) {
            return {
                type: 'immediate',
                value: parseInt(operand, 16),
                size
            };
        }

        // Check if it's a decimal immediate value
        if (operand.match(/^-?\d+$/)) {
            return {
                type: 'immediate',
                value: parseInt(operand, 10),
                size
            };
        }

        // Otherwise, treat it as a label
        return {
            type: 'label',
            value: operand,
            size
        };
    }

    parseMemoryOperand(operand) {
        // Simple memory operands: register, register+offset, offset
        operand = operand.toLowerCase();

        // Check for register+offset (e.g., ebp+4, eax-8)
        const offsetMatch = operand.match(/^(\w+)\s*([+-])\s*(\d+|0x[0-9a-f]+)$/i);
        if (offsetMatch) {
            const register = offsetMatch[1];
            const sign = offsetMatch[2];
            let offset = offsetMatch[3].startsWith('0x')
                ? parseInt(offsetMatch[3], 16)
                : parseInt(offsetMatch[3], 10);

            if (sign === '-') offset = -offset;

            return {
                type: 'register_offset',
                register,
                offset
            };
        }

        // Check if it's just a register
        if (this.isRegister(operand)) {
            return {
                type: 'register',
                register: operand
            };
        }

        // Check if it's just an offset
        if (operand.match(/^(0x[0-9a-f]+|\d+)$/i)) {
            const value = operand.startsWith('0x')
                ? parseInt(operand, 16)
                : parseInt(operand, 10);
            return {
                type: 'direct',
                address: value
            };
        }

        throw new Error(`Invalid memory operand: ${operand}`);
    }

    isRegister(operand) {
        const registers = [
            'eax', 'ebx', 'ecx', 'edx', 'esi', 'edi', 'ebp', 'esp', 'eip',
            'ax', 'bx', 'cx', 'dx', 'si', 'di', 'bp', 'sp',
            'al', 'ah', 'bl', 'bh', 'cl', 'ch', 'dl', 'dh'
        ];
        return registers.includes(operand.toLowerCase());
    }
}
