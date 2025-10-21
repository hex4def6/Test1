class Interpreter {
    constructor() {
        this.cpu = new CPU();
        this.memory = new Memory();
        this.parser = new Parser();
        this.executor = new Executor(this.cpu, this.memory);
        this.instructions = [];
        this.labels = {};
        this.currentInstruction = 0;
        this.executionLog = [];
        this.maxSteps = 10000; // Prevent infinite loops
        this.stepCount = 0;
    }

    load(code) {
        this.reset();
        const parsed = this.parser.parse(code);
        this.instructions = parsed.instructions;
        this.labels = parsed.labels;
    }

    reset() {
        this.cpu.reset();
        this.memory.reset();
        this.executor.reset();
        this.currentInstruction = 0;
        this.executionLog = [];
        this.stepCount = 0;
    }

    step() {
        if (this.executor.halted) {
            return { done: true, halted: true };
        }

        if (this.currentInstruction >= this.instructions.length) {
            return { done: true, halted: false };
        }

        if (this.stepCount >= this.maxSteps) {
            throw new Error(`Maximum step count (${this.maxSteps}) exceeded. Possible infinite loop?`);
        }

        const instruction = this.instructions[this.currentInstruction];
        this.cpu.registers.eip = this.currentInstruction;

        // Log state before execution
        const stateBefore = this.getState();

        // Execute instruction
        const jumpTarget = this.executor.execute(instruction, this.labels);

        // Update instruction pointer
        if (jumpTarget !== null) {
            this.currentInstruction = jumpTarget;
        } else {
            this.currentInstruction++;
        }

        this.stepCount++;

        // Log execution
        this.executionLog.push({
            instruction: instruction.raw,
            lineNumber: instruction.lineNumber,
            stateBefore,
            stateAfter: this.getState()
        });

        return {
            done: false,
            instruction: instruction.raw,
            lineNumber: instruction.lineNumber
        };
    }

    run() {
        this.reset();
        this.currentInstruction = 0;

        while (true) {
            const result = this.step();
            if (result.done) {
                break;
            }
        }

        return {
            output: this.executor.output,
            executionLog: this.executionLog,
            finalState: this.getState()
        };
    }

    getState() {
        return {
            registers: { ...this.cpu.registers },
            flags: { ...this.cpu.flags },
            currentInstruction: this.currentInstruction,
            stepCount: this.stepCount,
            output: [...this.executor.output]
        };
    }

    getMemoryView(start = 0, length = 256) {
        return this.memory.getMemoryView(start, length);
    }

    getCurrentInstruction() {
        if (this.currentInstruction >= 0 && this.currentInstruction < this.instructions.length) {
            return this.instructions[this.currentInstruction];
        }
        return null;
    }

    getInstructions() {
        return this.instructions;
    }

    getLabels() {
        return this.labels;
    }

    isHalted() {
        return this.executor.halted;
    }

    isDone() {
        return this.executor.halted || this.currentInstruction >= this.instructions.length;
    }
}
