class CPU {
    constructor() {
        this.reset();
    }

    reset() {
        // 32-bit general purpose registers
        this.registers = {
            eax: 0,
            ebx: 0,
            ecx: 0,
            edx: 0,
            esi: 0,
            edi: 0,
            ebp: 0,
            esp: 0xFFFF,  // Stack pointer starts at top of memory
            eip: 0        // Instruction pointer
        };

        // Flags register
        this.flags = {
            zf: 0,  // Zero flag
            sf: 0,  // Sign flag
            cf: 0,  // Carry flag
            of: 0   // Overflow flag
        };
    }

    getRegister(name) {
        name = name.toLowerCase();

        // Handle 32-bit registers
        if (this.registers.hasOwnProperty(name)) {
            return this.registers[name];
        }

        // Handle 16-bit registers (ax, bx, cx, dx)
        const reg16Map = {
            'ax': 'eax', 'bx': 'ebx', 'cx': 'ecx', 'dx': 'edx',
            'si': 'esi', 'di': 'edi', 'bp': 'ebp', 'sp': 'esp'
        };
        if (reg16Map[name]) {
            return this.registers[reg16Map[name]] & 0xFFFF;
        }

        // Handle 8-bit registers (al, ah, bl, bh, cl, ch, dl, dh)
        const reg8Map = {
            'al': ['eax', 0xFF], 'ah': ['eax', 0xFF00],
            'bl': ['ebx', 0xFF], 'bh': ['ebx', 0xFF00],
            'cl': ['ecx', 0xFF], 'ch': ['ecx', 0xFF00],
            'dl': ['edx', 0xFF], 'dh': ['edx', 0xFF00]
        };
        if (reg8Map[name]) {
            const [reg, mask] = reg8Map[name];
            if (mask === 0xFF) {
                return this.registers[reg] & 0xFF;
            } else {
                return (this.registers[reg] >> 8) & 0xFF;
            }
        }

        throw new Error(`Unknown register: ${name}`);
    }

    setRegister(name, value) {
        name = name.toLowerCase();

        // Ensure value is an integer
        value = value | 0;

        // Handle 32-bit registers
        if (this.registers.hasOwnProperty(name)) {
            this.registers[name] = value >>> 0; // Unsigned 32-bit
            return;
        }

        // Handle 16-bit registers
        const reg16Map = {
            'ax': 'eax', 'bx': 'ebx', 'cx': 'ecx', 'dx': 'edx',
            'si': 'esi', 'di': 'edi', 'bp': 'ebp', 'sp': 'esp'
        };
        if (reg16Map[name]) {
            const reg = reg16Map[name];
            this.registers[reg] = (this.registers[reg] & 0xFFFF0000) | (value & 0xFFFF);
            return;
        }

        // Handle 8-bit registers
        const reg8Map = {
            'al': ['eax', 0xFF], 'ah': ['eax', 0xFF00],
            'bl': ['ebx', 0xFF], 'bh': ['ebx', 0xFF00],
            'cl': ['ecx', 0xFF], 'ch': ['ecx', 0xFF00],
            'dl': ['edx', 0xFF], 'dh': ['edx', 0xFF00]
        };
        if (reg8Map[name]) {
            const [reg, mask] = reg8Map[name];
            if (mask === 0xFF) {
                this.registers[reg] = (this.registers[reg] & 0xFFFFFF00) | (value & 0xFF);
            } else {
                this.registers[reg] = (this.registers[reg] & 0xFFFF00FF) | ((value & 0xFF) << 8);
            }
            return;
        }

        throw new Error(`Unknown register: ${name}`);
    }

    updateFlags(result, size = 32) {
        // Zero flag
        this.flags.zf = (result === 0) ? 1 : 0;

        // Sign flag (check the most significant bit)
        if (size === 32) {
            this.flags.sf = (result & 0x80000000) ? 1 : 0;
        } else if (size === 16) {
            this.flags.sf = (result & 0x8000) ? 1 : 0;
        } else if (size === 8) {
            this.flags.sf = (result & 0x80) ? 1 : 0;
        }
    }

    setCarryFlag(value) {
        this.flags.cf = value ? 1 : 0;
    }

    setOverflowFlag(value) {
        this.flags.of = value ? 1 : 0;
    }
}
