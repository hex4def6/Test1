class Memory {
    constructor(size = 0x10000) { // 64KB default
        this.size = size;
        this.data = new Uint8Array(size);
    }

    reset() {
        this.data.fill(0);
    }

    readByte(address) {
        if (address < 0 || address >= this.size) {
            throw new Error(`Memory access violation at address 0x${address.toString(16)}`);
        }
        return this.data[address];
    }

    writeByte(address, value) {
        if (address < 0 || address >= this.size) {
            throw new Error(`Memory access violation at address 0x${address.toString(16)}`);
        }
        this.data[address] = value & 0xFF;
    }

    readWord(address) {
        // Read 16-bit value (little-endian)
        const low = this.readByte(address);
        const high = this.readByte(address + 1);
        return low | (high << 8);
    }

    writeWord(address, value) {
        // Write 16-bit value (little-endian)
        this.writeByte(address, value & 0xFF);
        this.writeByte(address + 1, (value >> 8) & 0xFF);
    }

    readDWord(address) {
        // Read 32-bit value (little-endian)
        const byte0 = this.readByte(address);
        const byte1 = this.readByte(address + 1);
        const byte2 = this.readByte(address + 2);
        const byte3 = this.readByte(address + 3);
        return (byte0 | (byte1 << 8) | (byte2 << 16) | (byte3 << 24)) >>> 0;
    }

    writeDWord(address, value) {
        // Write 32-bit value (little-endian)
        this.writeByte(address, value & 0xFF);
        this.writeByte(address + 1, (value >> 8) & 0xFF);
        this.writeByte(address + 2, (value >> 16) & 0xFF);
        this.writeByte(address + 3, (value >> 24) & 0xFF);
    }

    push(cpu, value, size = 32) {
        if (size === 32) {
            cpu.registers.esp = (cpu.registers.esp - 4) >>> 0;
            this.writeDWord(cpu.registers.esp, value);
        } else if (size === 16) {
            cpu.registers.esp = (cpu.registers.esp - 2) >>> 0;
            this.writeWord(cpu.registers.esp, value);
        }
    }

    pop(cpu, size = 32) {
        let value;
        if (size === 32) {
            value = this.readDWord(cpu.registers.esp);
            cpu.registers.esp = (cpu.registers.esp + 4) >>> 0;
        } else if (size === 16) {
            value = this.readWord(cpu.registers.esp);
            cpu.registers.esp = (cpu.registers.esp + 2) >>> 0;
        }
        return value;
    }

    getMemoryView(start, length) {
        const end = Math.min(start + length, this.size);
        const view = [];
        for (let i = start; i < end; i++) {
            view.push({
                address: i,
                value: this.data[i]
            });
        }
        return view;
    }
}
