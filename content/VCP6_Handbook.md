# The VCP6 Handbook

### A working textbook on the Teensy 4.1, TMC2209 stepper drivers, and the kinematics of a PAROL6-class robot arm

**Compiled August 2026**

---

## How to read this

This document is written to be read in order, like a textbook, but each part is self-contained enough that you can jump straight to the chapter you need. It is aimed at someone who is actually building the machine, so the emphasis throughout is on *why* a thing behaves the way it does, and then on the specific numbers, registers, and pin names you will need at the bench.

A few things to know going in.

Register values, formulas, and pin numbers here are a starting point rather than gospel — silicon revisions, breakout-board variants, and Teensyduino core updates all move things around. Confirm anything load-bearing against the TMC2209 datasheet, the PJRC pin card, or your own board before you commit to it in hardware.

The kinematics chapters use the published PAROL6 Denavit–Hartenberg table. I have checked it numerically: the forward kinematics it produces gives a reach of about 396 mm, which agrees with the published 400 mm figure, and the wrist axes intersect as they should. Your VCP6 is a variant, though, so if you change a link length or a mounting offset you will need to re-derive rather than re-use.

And these projects usually fail on power and grounding rather than on maths or firmware, which is why Chapter 6 spends a section on it.

---

## Table of Contents

**Part I — The Processor**
- Chapter 1: What a Teensy 4.1 actually is
- Chapter 2: Memory, cache, and why your ISR is slow
- Chapter 3: Timers, PWM, and the art of making step pulses
- Chapter 4: Serial communication on the Teensy 4.1

**Part II — Motors and Drivers**
- Chapter 5: Stepper motors from first principles
- Chapter 6: How a stepper driver actually works
- Chapter 7: The TMC2209 in detail
- Chapter 8: StallGuard, CoolStep, and sensorless homing

**Part III — Kinematics**
- Chapter 9: Frames, rotations, and homogeneous transforms
- Chapter 10: Denavit–Hartenberg and the forward kinematics of the PAROL6
- Chapter 11: Inverse kinematics: from a pose in space to six joint angles
- Chapter 12: The Jacobian, velocities, and singularities

**Part IV — Putting It Together**
- Chapter 13: From joint angles to step counts
- Chapter 14: Trajectory generation and the real-time motion pipeline
- Chapter 15: System architecture: host, Teensy, drivers
- Chapter 16: Bring-up order and a debugging checklist

**Appendices**
- A: Teensy 4.1 serial port pin map
- B: TMC2209 register cheat sheet
- C: PAROL6 numbers at a glance
- D: Formula reference
- E: Glossary
- F: A runnable reference implementation

# Chapter 1 — What a Teensy 4.1 actually is

## 1.1 The chip underneath

The Teensy 4.1 is a small development board built around a single NXP microcontroller, the i.MX RT1062. Understanding that chip is most of understanding the board, because almost everything surprising about the Teensy — the odd memory layout, the enormous number of serial ports, the way it boots — comes directly from the silicon rather than from anything PJRC added.

The i.MX RT1062 belongs to a family NXP calls "crossover" processors. The idea behind that name is that it sits between two worlds. On one side you have conventional microcontrollers: they run at tens or low hundreds of megahertz, they execute code directly out of on-chip flash, they boot instantly, and they behave deterministically. On the other side you have applications processors of the sort you find in a phone or a Raspberry Pi: they run at a gigahertz or more, they have caches and external memory, and they generally run a full operating system. The crossover parts take the fast core and the caches from the applications-processor world, and combine them with the instant boot, the hard real-time determinism, and the rich peripheral set of the microcontroller world.

Concretely, the RT1062 is an ARM Cortex-M7 running at 600 MHz, and the clock rate is only part of why it is quick. The M7 is *superscalar*, meaning it has two instruction pipelines and can retire up to two instructions per clock cycle when the code allows it. It has a six-stage pipeline with branch prediction, a proper hardware floating-point unit that handles both single and double precision, and the ARM DSP instruction set extension for saturating and SIMD-style integer arithmetic. In practical terms it will chew through the trigonometry in an inverse-kinematics solution without you having to think about it. A full six-axis IK solve using double-precision `atan2` and `sqrt` lands comfortably in the tens of microseconds, which means you could run it thousands of times a second if you wanted to.

This changes how you write the firmware. On an 8-bit AVR or even a 72 MHz STM32F1, you spend a lot of design effort avoiding floating point and pre-computing tables. On the Teensy 4.1 you can write the maths the way it appears in the textbook, in `float` or even `double`, and it will be fast enough. Take advantage of that rather than optimising ahead of any measurement.

## 1.2 The board around the chip

PJRC surrounds that processor with a fairly minimal but very well-chosen set of support hardware. There is 8 MB of QSPI flash on board for your program, of which just under 8 MB is available to you — an amount that is difficult to fill with hand-written firmware. There is a microSD socket wired to the SDIO peripheral in 4-bit mode, which is fast — not the bit-banged SPI arrangement you find on cheaper boards. There is a 10/100 Ethernet MAC brought out to a set of pads (you supply the magjack). There are USB host pins, so the Teensy can act as a USB *host* and talk to keyboards, or to another microcontroller. And there are two footprints on the underside of the board for extra QSPI chips: you can solder on additional flash, or PSRAM, or one of each.

Electrically, the board runs at 3.3 volts, and **the pins are not 5 volt tolerant**. Putting 5 V on a Teensy 4.x input pin is a reliable way to destroy that pin, and sometimes the chip. That matters here because a great many stepper driver breakout boards, limit switch boards, and cheap optical endstops are designed around 5 V logic. Every one of those needs either a level shifter, a resistive divider, or an open-collector arrangement with the pull-up going to 3.3 V rather than 5 V. It is worth asking what voltage a thing actually drives before you connect it.

The output drive is also modest. A Teensy 4.x pin sources or sinks a few milliamps comfortably — around 4 mA in the default pad configuration, and the pad drive strength can be increased in the register settings, but treat something like 10 mA as a practical ceiling per pin and keep the total across the chip well below its absolute maximum. That is plenty for the STEP, DIR, and EN inputs of a TMC2209, which are high-impedance CMOS inputs drawing essentially no current. It is not enough for a relay coil, a solenoid, or a brake. Anything with a coil in it gets a transistor and a flyback diode.

Power comes in over USB or over the VIN pin, which accepts roughly 3.6 to 5.5 V. The board draws on the order of 100 mA at full speed. One detail catches people out: the Teensy 4.1 ships with a solder pad between VUSB and VIN that is bridged by default. If you intend to power the board from an external 5 V supply *while also* having USB plugged in for programming and debugging — which you will, constantly, during development — cut that trace. Otherwise your bench supply's 5 V rail is tied straight to your computer's USB 5 V rail, which at best does nothing and at worst damages a USB port.

## 1.3 The peripheral set, and what you will actually use

The RT1062 has far more peripherals than any one project needs. The subset that matters for a six-axis stepper-driven arm is as follows.

For **digital I/O**, you have 55 usable pins, of which 42 are on the outer edges and breadboard-friendly; the rest are on the underside pads. A six-axis arm with STEP, DIR, and a shared enable, plus six DIAG lines, plus six limit switches, plus a UART pair for the drivers, comes to well under half of that. Since you will not run out of pins, you can afford to give each driver its own DIAG input rather than wire-OR-ing them.

For **timing**, there are four FlexPWM modules, each with three submodules; four QuadTimer modules with four channels each; four Periodic Interrupt Timers; and two General Purpose Timers. Chapter 3 is about how to spend all of that.

For **serial**, there are eight hardware UARTs (`Serial1` through `Serial8`), three SPI buses, three I²C buses, two CAN 2.0B controllers plus one CAN-FD controller, and the native high-speed USB. Chapter 4 covers these.

For **feedback**, there are four hardware quadrature decoder units, which can count encoder pulses entirely in hardware without troubling the CPU. If you ever move the VCP6 from open-loop steppers to closed-loop with encoders on the joints, this is what you will use, so leave the right pins free now.

For **analogue**, there are two ADCs covering 18 input pins, with 12-bit resolution available. Useful for reading a potentiometer-based teach pendant, monitoring supply voltage, or reading a current-sense output.

And underpinning all of it, a **32-channel DMA controller**. DMA lets a peripheral move data to or from memory without the CPU being involved at all. For stepper control that is what keeps the step train steady while the USB link is busy.

## 1.4 Clocking and overclocking

The 600 MHz figure is the default, not a limit. The Teensyduino tools menu lets you select clock speeds from 24 MHz up to 1 GHz. Running above 600 MHz requires attention to cooling — the little chip will happily throttle or misbehave when hot, and PJRC sell a heatsink kit for exactly this reason.

For a robot arm, my advice is to leave it at 600 MHz. You will not be compute-bound. What you *will* be is timing-bound, and a stable, well-characterised clock is worth more than headline speed. If you ever find yourself wanting to overclock to make the motion planner keep up, the correct fix is almost always to restructure the planner rather than to raise the clock.

One clocking detail does matter: the RT1062's clock tree is complex, with multiple PLLs feeding different peripheral groups, and some peripherals derive their clocks from sources you might not expect. When you compute a timer period or a UART baud divisor by hand, always confirm which clock actually feeds that peripheral rather than assuming it is the core clock. The Teensyduino core handles this for you in the standard APIs; it becomes your problem only when you drop to bare registers.

# Chapter 2 — Memory, cache, and why your ISR is slow

## 2.1 The layout

The Teensy 4.1 has 1024 KB of on-chip RAM, and the way it is divided catches people out.

The first 512 KB is called RAM1, and it is *tightly coupled memory* — TCM. Tightly coupled memory is connected to the Cortex-M7 through dedicated buses that bypass the normal system interconnect entirely. Access is single-cycle, deterministic, and never contends with DMA or with anything else on the bus. RAM1 is split into two halves at compile time, in 32 KB blocks: **ITCM**, which holds executable code, and **DTCM**, which holds your ordinary variables, your stack, and anything you have not explicitly placed elsewhere.

The second 512 KB is called RAM2, or OCRAM — on-chip RAM. This sits on the normal AXI bus. It is still fast, but access goes through the data cache, and it can contend with DMA transfers. In the Teensyduino world, RAM2 is where `malloc` allocates from, and where anything you mark with the `DMAMEM` attribute is placed.

Then there is the 8 MB of QSPI flash. Your program lives there when the board is powered off, but at boot the Teensy copies the code into ITCM and runs it from there. This is why a Teensy 4.1 takes a fraction of a second to start: it is not just jumping to a reset vector, it is performing a copy. It is also why your available fast RAM shrinks as your program grows — every kilobyte of code claims a kilobyte of ITCM.

Optionally, you can solder PSRAM to the underside pads. That gives you a large, slower external memory, reachable as `EXTMEM`. For a robot arm you would use it for something like a long recorded trajectory, or a big lookup table, not for anything in the real-time path.

## 2.2 Why this matters for real-time motion control

The practical rule that follows: **anything in your step-generation interrupt should live in tightly coupled memory.**

The reason is cache behaviour. Code and data in RAM2, or in flash, go through the M7's 32 KB instruction cache and 32 KB data cache. Caches help average-case throughput and hurt worst-case latency. When the data your interrupt needs happens to be in cache, the access takes a cycle. When it is not — a cache miss — you stall for many cycles while the memory system fetches a whole cache line. In ordinary code you never notice. In an interrupt that has to fire every 50 microseconds and produce a step pulse with tight timing, an unpredictable multi-cycle stall shows up as *jitter*, and jitter in step timing shows up as audible noise and, at high speeds, as lost steps.

On the Teensy the default is already the right one. Ordinary global and static variables land in DTCM, and code lands in ITCM, unless you have said otherwise. You mostly need to know this so that you *don't* do the wrong thing — for example, don't put your step-position array in `DMAMEM` because you read somewhere that DMAMEM is for buffers. Put DMA buffers there, and keep the motion state in DTCM.

The second half of the rule concerns cache coherency. If you set up a DMA transfer to move data from a buffer in RAM2 out to a peripheral, the CPU may have written that data into the data cache but not yet flushed it out to the actual RAM the DMA engine reads. The result is that the DMA sends stale data. The Teensyduino core provides `arm_dcache_flush_delete()` and related functions for exactly this, and any DMA-based approach must call them at the right moments. Missing them is the usual cause of "my DMA works sometimes" on the Teensy 4.x.

## 2.3 Practical guidance

Write your firmware normally to begin with. Do not preemptively scatter memory attributes around. When you get to the point of measuring step-pulse jitter with a scope — and you should get to that point — you will know exactly which buffers to move and why. The defaults on this chip are good, and moving things around before you have measured is guesswork.

Do, however, keep an eye on the compile-time report Teensyduino prints. It tells you how much of RAM1 has gone to code, how much is left for variables, and how much RAM2 is in use. If ITCM usage creeps up towards the point where your variables no longer fit in DTCM, you will want to know before the linker tells you in a confusing way.

# Chapter 3 — Timers, PWM, and the art of making step pulses

## 3.1 What a stepper driver actually wants from you

Before the Teensy's timers, it helps to be precise about what the controller has to produce.

A step/direction driver like the TMC2209 has two logic inputs that matter for motion. **DIR** is a level: high means one direction, low means the other. **STEP** is an edge: on each rising edge, the driver advances its internal microstep counter by one position, which shifts the current in the two motor coils by one increment around the sine/cosine table, which rotates the motor by one microstep.

That is the whole interface. There is no position, no velocity, no acknowledgement. The driver has no idea where the motor is and no idea whether it got there. Everything about position and speed is encoded purely in *when* you send the edges.

The requirements are: DIR must be stable for a short setup time before the STEP edge (the TMC2209 needs on the order of 20 ns, which is nothing — but if you toggle DIR in one interrupt and STEP in another you can violate it, so don't); the STEP pulse must be at least a minimum width high and a minimum width low (again, tens of nanoseconds for the TMC2209 — trivially satisfied); and the *interval* between edges determines speed.

The interval is where the difficulty lives. Motor speed in revolutions per second is simply the step frequency divided by the number of microsteps per revolution. To accelerate smoothly, you must smoothly vary the interval between consecutive edges. To coordinate six axes so that the tool moves in a straight line, you must produce six independent, precisely-related pulse trains simultaneously. And any error in the timing of those edges — any jitter — is a small velocity error, which at best makes noise and at worst causes a motor to lose synchronisation with its field and skip.

## 3.2 The step-rate budget

It is worth working out how hard this is for the VCP6.

A standard NEMA-17 stepper is 1.8° per full step, which is 200 full steps per revolution. At 1/32 microstepping — which is what the PAROL6 uses on all axes — that is 6400 microsteps per motor revolution. Now apply the reduction ratios: joint 2 has a 20:1 planetary gearbox, so a full revolution of joint 2 takes 128,000 microsteps.

Suppose you want joint 2 to move at 60° per second, which is a fairly brisk but not extreme speed for a desktop arm. That is one sixth of a revolution per second, so about 21,300 steps per second. Joint 1, with its 6.4:1 belt, needs about 6,800 steps per second for the same angular rate. Sum across six axes moving together and you are looking at a worst case somewhere in the region of 60,000 to 100,000 step events per second.

Now the key architectural question: can you afford an interrupt per step? At 100,000 interrupts per second on a 600 MHz core, you have 6,000 clock cycles between interrupts. Interrupt entry and exit on a Cortex-M7 costs on the order of 20 to 30 cycles. Even a fairly heavy handler doing per-axis Bresenham arithmetic will fit in a few hundred cycles. So yes, comfortably. The Teensy's speed buys you the simple architecture here, which is worth taking.

Compare that with an 8-bit AVR at 16 MHz, where the same interrupt rate would leave you 160 cycles and the answer would be a firm no. Much of the received wisdom in the 3D printer and CNC world about clever step-generation tricks was developed under that constraint, which you do not have.

## 3.3 The timing resources available

**Periodic Interrupt Timers (PIT)** are the simplest option, and on the Teensy they are exposed through the `IntervalTimer` class. You get four of them. You give one a period in microseconds and a function to call, and it calls that function at that rate, forever. `IntervalTimer` accepts floating-point microseconds and internally computes the closest achievable divisor from the peripheral clock, so the resolution is far better than one microsecond. This is the workhorse for a fixed-rate control loop.

**FlexPWM** modules are the sophisticated option. There are four of them, each with three submodules, each submodule having two outputs. FlexPWM can generate pulses entirely in hardware with no CPU involvement, can be reloaded from a buffer, can be triggered by and can trigger other peripherals, and can be driven by DMA. If you want *perfectly* jitter-free step pulses at very high rates, FlexPWM is how you get them. The cost is complexity: you are programming a fairly intricate peripheral more or less directly.

**QuadTimer** modules — four of them, four channels each — sit between the two in capability. They can generate periodic outputs, capture input edges, and cascade. The well-known `TeensyStep` library uses these to generate step pulses in hardware, which is why it can hit step rates in the hundreds of thousands per second without the CPU melting.

**General Purpose Timers (GPT)**, of which there are two, are similar in spirit to the PIT but with more features.

And finally the **ARM cycle counter**, `ARM_DWT_CYCCNT`, is a free-running 32-bit counter incrementing once per core clock. At 600 MHz it wraps about every seven seconds. It is not a scheduling mechanism, but it is the easiest way to *measure* how long a piece of code takes. Instrument your interrupt handler with it early.

## 3.4 Three architectures, and which to choose

**Architecture one: the fixed-rate DDA.** You run a single `IntervalTimer` at a constant high rate — say 20 kHz or 40 kHz. On every tick, for each of the six axes, you run a Bresenham-style accumulator: add that axis's "steps remaining" increment to an accumulator, and when the accumulator overflows, emit a step pulse on that axis. Acceleration is handled by recomputing the increments periodically from a velocity profile.

This is the architecture used by GRBL, by Marlin, and by most of the CNC world. It produces exactly coordinated multi-axis motion, because all axes are driven from the same tick and therefore cannot drift relative to one another. It is straightforward to reason about, and it has a bounded, predictable CPU cost — one interrupt at a fixed rate, regardless of how fast the motors are going. And the step timing quantisation it introduces (each step lands on a tick boundary) is small if your tick rate is comfortably above your maximum step rate.

Its limitation is exactly that quantisation. If your tick rate is 20 kHz, your maximum step rate is 20 kHz per axis, and step intervals are quantised to 50 µs. At high speeds that quantisation becomes a meaningful fraction of the interval and shows up as velocity ripple. The fix is simply to raise the tick rate, which on a 600 MHz M7 you can afford to do.

**Architecture two: per-axis hardware timers.** Give each axis its own timer channel, programmed to generate a pulse train at that axis's current required rate, and reprogram the rate periodically as the velocity profile evolves. `TeensyStep` works essentially this way. The advantage is very high achievable step rates with essentially zero jitter and almost no CPU load. The disadvantage is that coordinating six axes so that they arrive together requires care, because each timer runs independently and there is no shared tick keeping them in lockstep.

**Architecture three: DMA-fed hardware PWM.** You precompute a buffer of pulse timings and let DMA feed them to a FlexPWM module. This is the highest-performance and highest-complexity option — appropriate for very fast machines, and overkill for a desktop arm.

**My recommendation for the VCP6 is architecture one**, a fixed-rate DDA at something like 25 to 50 kHz, driven by an `IntervalTimer`. It gives you exact multi-axis coordination, which is what a robot arm needs — a Cartesian straight line depends on all six joints tracking a common time base. Measure the ISR duration with the cycle counter, confirm you are using well under half the available time, and move on.

## 3.5 Structuring the step ISR

A fixed-rate step ISR has a specific shape: minimum possible work, and no blocking. Concretely:

The ISR reads a "current segment" structure that some lower-priority code has prepared: the step increments per axis, the direction bits, and how many ticks this segment lasts. It updates the six accumulators, sets any direction pins that need to change, emits step pulses where accumulators overflowed, decrements the segment's remaining tick count, and — if the segment is finished — pops the next segment from a ring buffer. That is all.

Everything else happens outside the ISR. Velocity profiling, look-ahead, inverse kinematics, communication with the host: all of it runs in the main loop or in a lower-priority interrupt, producing segments into the ring buffer that the ISR consumes. The ring buffer is the boundary between the hard real-time world and the soft real-time world, and keeping that boundary clean is the structural decision the rest of the firmware rests on.

Two implementation details are worth stating explicitly. Variables shared between the ISR and the main loop must be declared `volatile`, or the compiler will happily cache them in a register and your main loop will never see the ISR's updates. And on a Cortex-M7 with a write buffer, if the last thing your ISR does is clear an interrupt flag, add a memory barrier or a dummy read afterwards, or the write may not have landed before the ISR returns and you will get a spurious re-entry.

For the step pulse itself, there is no need for a delay. Set all the step pins high at the start of the ISR body, do all your accumulator arithmetic, and set them low at the end. The arithmetic itself provides the pulse width, it is comfortably longer than the driver's minimum, and you have spent no time waiting.

# Chapter 4 — Serial communication on the Teensy 4.1

## 4.1 What "serial" means here

"Serial" gets used loosely. On the Teensy 4.1 there are several different things that all get called serial at one time or another.

There is **USB serial**, which is the `Serial` object, the thing that appears as a COM port or `/dev/ttyACM*` on your computer when you plug the board in. There are **eight hardware UARTs**, `Serial1` through `Serial8`, which are asynchronous serial ports on physical pins. There is **SPI**, a synchronous, clocked, master-driven bus. There is **I²C**, a two-wire addressed bus. And there is **CAN**, a differential multi-drop bus designed for noisy environments.

They solve different problems and you will probably end up using three of them.

## 4.2 The eight hardware UARTs

Each of the Teensy's eight serial ports is backed by an independent LPUART peripheral in the RT1062. Independent in the literal sense: they run in parallel, in hardware, with no software multiplexing and no shared bandwidth. You can have all eight running simultaneously at different baud rates without any of them affecting the others.

The pin assignments are fixed by the silicon's pin multiplexing, and are as follows on the Teensy 4.1:

| Port | RX pin | TX pin |
|---|---|---|
| `Serial1` | 0 | 1 |
| `Serial2` | 7 | 8 |
| `Serial3` | 15 | 14 |
| `Serial4` | 16 | 17 |
| `Serial5` | 21 | 20 |
| `Serial6` | 25 | 24 |
| `Serial7` | 28 | 29 |
| `Serial8` | 34 | 35 |

Note that `Serial8` exists only on the Teensy 4.1, not the 4.0, and that pins 34 and 35 are on the underside of the board in the second row. Note also the ordering trap: for most ports RX comes before TX numerically, but `Serial3` and `Serial5` are the other way round. If a port is silent, swapping RX and TX is the first thing to try.

Using one:

```cpp
void setup() {
  Serial1.begin(115200);          // 8 data bits, no parity, 1 stop bit
  Serial2.begin(250000, SERIAL_8E1);  // 8 data, even parity, 1 stop
}
```

The baud rate is generated by dividing a peripheral clock, so not every arbitrary number is exactly achievable. The core picks the closest divisor. UART framing tolerates roughly 2–3% total error between the two ends before it starts corrupting bytes, and standard rates are chosen to divide nicely, so it only causes trouble at unusual rates or very high speeds.

## 4.3 Buffers, FIFOs, and flow control

Each LPUART has a small hardware FIFO — four bytes deep on this part. Above that, the Teensyduino core maintains software ring buffers in RAM, filled and drained by the UART interrupt. This layering is why `Serial1.write()` returns almost immediately: it copies into the software buffer and lets the interrupt dribble the bytes out at baud rate in the background.

The consequence is that `write()` only blocks when the software transmit buffer is full. The default buffers are modest — a few hundred bytes. If you send a burst larger than the buffer, `write()` will sit there spinning until space frees up, which at 115200 baud means about 87 microseconds per byte. Blocking the main loop for milliseconds because of a debug message is a common way to disturb a motion controller.

The core gives you two tools. `Serial1.addMemoryForWrite(buffer, size)` and the matching `addMemoryForRead` let you hand the driver a larger buffer of your own. And `Serial1.availableForWrite()` tells you how much space is free. In real-time code, check before writing, and if there is no room, drop the message or defer it rather than blocking the motion loop.

For hardware flow control, the LPUARTs support RTS and CTS, exposed as `Serial1.attachRts(pin)` and `Serial1.attachCts(pin)`. They also support a **transmitter enable** output via `Serial1.transmitterEnable(pin)`, which asserts a pin for exactly the duration of a transmission. That last one is specifically designed for half-duplex RS-485, where you need to switch a transceiver between drive and receive around each message, and getting that timing right in software is fiddly. For a long cable to a remote I/O board on the arm, RS-485 with `transmitterEnable` is the way to do it.

## 4.4 USB serial

The `Serial` object is not a UART at all. It is a USB CDC virtual serial device implemented over the Teensy's native high-speed USB, which runs at 480 Mbit/s. As a result the `begin()` baud rate argument is entirely ignored — there is no physical baud rate to set. Actual throughput is limited by USB packet scheduling and by the host, and lands somewhere in the region of 10–25 MB/s in practice, which is orders of magnitude beyond any UART.

Two behaviours to know about. First, USB CDC is packet-based, not stream-based at the hardware level: the Teensy accumulates written bytes and sends them either when a packet fills or after a short timeout. If you want a message to go out immediately, call `Serial.send_now()`. Second, `Serial` reports as false in a boolean context until the host has actually opened the port. `while (!Serial) ;` in `setup()` will hang forever if you power the board from a bench supply with no computer attached — which is the situation the finished robot will be in. Guard it with a timeout, or leave it out and accept that you will miss the first few debug lines.

For the VCP6, USB serial is the natural choice for the host link: it is fast, it needs no extra hardware, and the same cable programs the board.

## 4.5 Choosing the right bus for each job

How I would allocate the buses on a six-axis arm:

**Host to Teensy**: USB serial. Fast, free, and already there.

**Teensy to TMC2209 drivers**: a hardware UART, in the TMC2209's single-wire UART mode. This is covered in detail in Chapter 7. The short version is that up to four drivers can share one UART line by address, so six axes need two UARTs — say `Serial1` and `Serial2`. Run them at 115200 baud, which is plenty since driver configuration is not in the real-time path.

**Teensy to a teach pendant, display, or auxiliary board**: another UART, or I²C if the device is nearby and slow.

**Teensy to a gripper or tool**: depends on the tool. A simple servo gripper needs one PWM pin. A smart gripper might want its own UART.

**Anything over a long or noisy cable**: CAN, or RS-485. Both are differential, and both survive electrical environments that would defeat a plain UART. A desktop arm with sub-metre cable runs probably does not need either — but if you do start seeing corrupted bytes on a cable that runs alongside a motor lead, the answer is a differential bus rather than a higher baud rate.

## 4.6 Designing the host protocol

Whatever you send over the host link, design the framing deliberately. Printing human-readable lines terminated by newline is fine for debugging and poor for control: a single dropped byte desynchronises you, floating-point text parsing is slow, and there is no way to detect corruption.

A robust binary frame has four parts: a **start marker** (a distinctive byte, or better a two-byte sequence unlikely to occur in data), a **length** field, the **payload**, and a **checksum or CRC** over the payload. The receiver runs a small state machine: hunt for the start marker, read the length, accumulate that many payload bytes, verify the CRC, and only then act. If the CRC fails, discard and go back to hunting. That recovers from corruption on its own, which a newline-delimited text protocol does not.

Add a **sequence number** if you care about detecting lost frames, and an **acknowledgement** from the Teensy back to the host if you need flow control at the application level. For a robot arm, I would define a small set of message types: set joint targets, request status, set driver current, home an axis, emergency stop. Keep the emergency stop message as short and as distinctive as possible, and handle it before you do anything else in the parser.

One last protocol point: **do not let the arm keep moving if the host goes quiet.** Implement a watchdog. If the Teensy has not heard a valid frame from the host within some timeout — a few hundred milliseconds — it should decelerate to a stop and hold. An arm that carries on executing its last command after the control PC crashes will eventually hit something.

# Chapter 5 — Stepper motors from first principles

## 5.1 What is inside

A hybrid stepper motor — the type in essentially every NEMA-17 you will encounter — has a rotor and a stator, and most of its behaviour comes from the geometry of the teeth.

The rotor is a permanent magnet mounted axially, with a soft-iron cup at each end. Each cup is machined with fifty teeth around its circumference. The two cups are offset from one another by half a tooth pitch, and because the magnet runs between them, one end cap is magnetically north and the other south. So going around the rotor you see fifty north teeth, and interleaved between them, fifty south teeth — one hundred teeth in total, alternating in polarity.

The stator surrounds it and carries eight poles, each wound with a coil, each pole also having several small teeth on its face. The eight coils are wired into two independent phases, usually called A and B. The two phases are positioned so that when phase A's teeth are perfectly aligned with rotor teeth, phase B's are offset by a quarter of a tooth pitch.

Energise phase A and the rotor snaps to align with it. Now de-energise A and energise B: the nearest alignment for B is a quarter tooth pitch away, so the rotor rotates by that amount. Continue through the four combinations — A positive, B positive, A negative, B negative — and the rotor advances one full tooth pitch, then repeats. With fifty teeth and four steps per tooth, you get two hundred steps per revolution, which is 1.8° each.

So 200 steps per revolution is not a software convention; it falls out of the fifty-tooth rotor geometry.

## 5.2 Torque, and why it falls off with speed

The torque a stepper produces is, to a good approximation, proportional to the *phase current*, not the voltage. Most of how stepper drivers are built follows from that.

The problem is that a motor winding is an inductor. When you apply a voltage V across an inductance L with resistance R, the current does not appear instantly; it rises exponentially with time constant L/R towards a final value V/R. A typical NEMA-17 winding might have 2–4 mH of inductance and a couple of ohms of resistance, giving a time constant of a millisecond or so.

Now consider running the motor fast. At 1000 full steps per second, each step lasts one millisecond, and the driver has to reverse the current in a winding within that time. If the time constant is also a millisecond, the current never gets close to its target before it is asked to reverse. Average current falls, and torque falls with it.

Worse, a spinning motor generates back-EMF proportional to speed, which opposes the applied voltage and further reduces the current the driver can push. Together these produce the characteristic stepper **torque–speed curve**: flat holding torque at zero and low speed, then a progressively steeper roll-off, until at some speed the motor cannot produce enough torque to turn its own rotor and stalls.

The remedy is voltage. If you drive the winding from a much higher voltage than V = I·R would suggest, current rises far faster, because the initial rate of rise is V/L. Then you chop the voltage on and off rapidly to regulate the average current to the value you actually want. That is what a chopper driver does, and it is why you run a 24 V supply into a driver for a motor whose windings are rated at 2 volts. **Higher supply voltage buys you high-speed torque, and nothing else.** Within the driver's rating, more volts is generally better.

For the VCP6, this argues for running the highest supply voltage your drivers and your thermal budget allow. The TMC2209 accepts up to 29 V, so a 24 V supply is the natural choice — it leaves margin for supply tolerance and for the voltage spikes a decelerating motor pumps back into the rail.

## 5.3 Microstepping, and what it does and does not give you

If instead of switching the phases fully on and off you drive them with currents that follow a sine and a cosine, the resulting magnetic field vector rotates smoothly rather than jumping, and the rotor follows it smoothly. Divide each full step into 32 increments and you have 1/32 microstepping: 6400 positions per revolution instead of 200.

Microstepping gives you two real benefits and one illusory one.

The first real benefit is **smoothness**. Full-stepping slams the rotor between positions, exciting the motor's mechanical resonance, producing audible noise, and — on a lightweight 3D-printed arm — visible vibration. Microstepping makes the motion continuous and quiet, which on a machine like the VCP6 is reason enough on its own.

The second real benefit is **avoiding resonance**. A stepper plus its load forms a resonant system, typically somewhere in the region of 100 Hz. Drive it at full steps near that rate and the oscillation can build until the motor loses steps entirely — mid-band resonance. Microstepping spreads the excitation across many small increments and largely eliminates the problem.

The illusory benefit is **resolution**. 1/32 microstepping does not give you 32 times the positional accuracy. The torque a stepper produces is proportional to the sine of the angular error between rotor and field. Between full-step positions, that relationship means the *incremental* holding torque near a microstep position is very small — roughly proportional to the sine of one microstep angle. With 1/32 microstepping, a microstep is 0.056°, and the torque available to hold that precise position is a percent or two of the motor's full holding torque. Any friction, any load torque, and the rotor simply sits somewhere else. In an open-loop system, the achievable positional accuracy is set by friction, by gearbox backlash, and by structural compliance — not by microstep count.

So: microstep for smoothness, and get your accuracy from the mechanics and from calibration. The PAROL6's quoted 0.1 mm repeatability comes from its gearboxes and its structure, not from its microstepping.

The TMC2209 also has a feature called MicroPlyer: feed it a modest step rate and it interpolates internally up to 1/256 microstepping. You get the smoothness of very fine microstepping while the controller generates a thirty-second of the pulses — a useful reduction in step-generation load across six axes.

## 5.4 The specific motors in a PAROL6-class arm

The PAROL6 uses NEMA-17 steppers throughout, at 1/32 microstepping, with the following reductions:

| Joint | Reduction type | Ratio |
|---|---|---|
| J1 | Belt | 6.4 : 1 |
| J2 | Planetary gearbox | 20 : 1 |
| J3 | Planetary × belt | 18.1 : 1 |
| J4 | Belt | 4 : 1 |
| J5 | Belt | 4 : 1 |
| J6 | Planetary gearbox | 10 : 1 |

The reductions do two things. They multiply torque, which is what lets a small stepper hold a 1 kg payload at 400 mm. And they multiply resolution, so that even though a microstep is a coarse thing at the motor, it is a fine thing at the joint. Chapter 13 works through the numbers.

They also introduce backlash, which is the design's real limitation. A belt drive has very little backlash but does have compliance — it stretches under load. A planetary gearbox has meaningful backlash, typically measured in arc-minutes. Neither is visible to the controller in an open-loop system: the Teensy knows how many pulses it sent, not where the joint actually is. Every source of lost motion downstream of the motor is invisible error.

## 5.5 A thermal warning specific to this arm

The PAROL6 is printed in PETG, and PETG softens at temperatures a stepper motor reaches without difficulty. The official documentation gives operating limits in the region of 48–61 °C for holding and 52–73 °C while moving, and explicitly tells you to reduce motor current in software for extended operation.

A stepper at its rated current, holding position, dissipates its full I²R losses continuously and gets hot enough to soften a printed motor mount. The mount then deforms, alignment goes, and accuracy degrades well before anything visibly fails.

The mitigations are, in order of usefulness: run the lowest current that reliably holds the load, use the driver's automatic hold-current reduction so that a stationary motor drops to a fraction of its running current, disable motors entirely when the arm is parked and not required to hold position, and monitor driver temperature flags so the firmware can back off before something melts. The TMC2209 gives you all of these; Chapter 7 covers `IHOLD_IRUN`, `TPOWERDOWN`, and the over-temperature warning flags.

# Chapter 6 — How a stepper driver actually works

## 6.1 The H-bridge

At the bottom of every stepper driver are two H-bridges, one per phase. An H-bridge is four transistors arranged around a load in the shape of the letter H: two on the high side connecting to the supply, two on the low side connecting to ground, and the winding across the middle.

Turn on the top-left and bottom-right transistors and current flows left-to-right through the winding. Turn on top-right and bottom-left and it flows right-to-left. Turn on both low-side transistors and the winding is short-circuited to ground, which lets circulating current decay slowly. Turn everything off and the current has nowhere to go except through the body diodes back into the supply, which makes it decay very fast.

Those four states — drive forward, drive reverse, slow decay, fast decay — are the complete vocabulary of the power stage. Everything a driver does is a pattern of switching between them.

One thing an H-bridge must never do is turn on the high-side and low-side transistors of the same leg simultaneously, which shorts the supply straight to ground through the transistors. This is called shoot-through and it destroys drivers. Every real driver inserts a small dead time between turning one off and the other on. You do not have to configure it, but dead time is one of the things that limits how fine the current control can be at very low currents.

## 6.2 Chopper current regulation

The driver's job is to make the winding current follow a target. Since the winding is an inductor fed from a supply much higher than V = I·R, the approach is to switch rapidly.

The classic scheme, and the one the TMC2209 uses in its `SpreadCycle` mode, is **constant off-time chopping with current comparison**. The driver turns on the appropriate transistors to drive current through the winding. Current ramps up. A sense resistor in series with the low side develops a voltage proportional to that current, and a comparator watches it. When the current reaches the target, the driver switches to a decay state and holds it for a fixed off-time. During that off-time the current falls. When the off-time expires, the driver drives again, current rises to the target, and the cycle repeats. The result is a current that hovers around the target in a small sawtooth, at a chopping frequency typically in the tens of kilohertz.

The subtlety is in *how* it decays. Pure slow decay (shorting the winding) means current falls slowly, which is good for ripple but bad when the target current is falling rapidly — the actual current cannot follow it down and you get distortion of the sine wave. Pure fast decay tracks a falling target well but produces large ripple and more heating. Trinamic's SpreadCycle is a mixed scheme that automatically chooses fast or slow decay based on measured behaviour, which is why it does not need the decay-mode tuning that older drivers such as the A4988 and DRV8825 require.

## 6.3 StealthChop: a different approach

Trinamic's other mode, `StealthChop`, does not regulate current cycle-by-cycle at all. Instead it is a **voltage-mode PWM**: the driver applies a PWM voltage to the winding whose duty cycle is computed to produce the desired current, and it adjusts that duty cycle slowly based on measurements. Because the PWM runs at a fixed frequency and the current is not being chopped against a comparator threshold, the current waveform is far smoother and there is no chopper noise.

The result is a motor that is essentially silent: a stepper that whines audibly under SpreadCycle becomes inaudible under StealthChop.

The trade-off is dynamic response. Because StealthChop regulates slowly, it does not handle rapid changes in load or rapid acceleration as well as SpreadCycle does, and its high-speed torque is lower. The standard configuration is therefore to run StealthChop at low speeds where noise matters and torque demand is low, and switch automatically to SpreadCycle above a velocity threshold. The TMC2209 does this for you: set the `TPWMTHRS` register to a velocity threshold and the chip handles the crossover.

For a robot arm, I would start in StealthChop everywhere — desktop arm speeds are modest and the quiet is worth having — then enable the SpreadCycle crossover on any joint that struggles at speed, typically J2 and J3, which carry the most load.

## 6.4 Setting the current

Current is the setting most often got wrong, so it pays to be methodical.

A stepper motor's data sheet gives a **rated current per phase**. This is the current at which the manufacturer guarantees the motor will not exceed its temperature rating in still air at some ambient temperature. It is a thermal limit rather than a hard one: exceeding it does not cause instant failure, it makes the motor run hotter, which on a PETG-framed arm matters.

Note also whether the rating is RMS or peak. Driver current settings are usually specified in RMS, and motor ratings are often given as peak-per-phase. The ratio is $\sqrt{2}$, so confusing them puts you off by 41%.

There are two ways to set current on a TMC2209, and they interact, so both are worth understanding.

The **analogue** route uses the VREF pin. In standalone mode, and by default in UART mode too, the chip scales its current reference by the voltage on VREF. Breakout boards fit a small trimpot that divides the internal 5 V rail down to VREF, so turning the pot changes the current. This is the "measure VREF with a multimeter and turn the tiny screw" ritual familiar from 3D printers.

The **digital** route uses the `IHOLD_IRUN` register over UART. `IRUN` is a 5-bit value, 0 to 31, that scales the current while the motor is moving. `IHOLD` is a separate 5-bit value used when the motor has been stationary for a while. This is better than the pot: repeatable, remotely settable, and able to drop hold current automatically.

The interaction is where it catches people. GCONF bit 0, `i_scale_analog`, selects whether VREF scales the current. On the TMC2209 this bit **defaults to 1**, meaning VREF is in play. So you can set `IRUN` to 31 over UART and still get a fraction of the current you expected, because the pot on the board is turned down. Either set `i_scale_analog = 0`, so the internal reference is used and `IRUN` alone determines current, or turn the pot to maximum and control everything digitally. I would do the former; it removes an analogue variable from the system.

The formula relating `IRUN` to actual current, from the datasheet, is:

$$
I_{\text{RMS}} = \frac{CS + 1}{32} \times \frac{V_{\text{FS}}}{R_{\text{sense}} + 0.02\,\Omega} \times \frac{1}{\sqrt{2}}
$$

where `CS` is the current-scale value (i.e. `IRUN` while moving, `IHOLD` at rest), `R_sense` is the sense resistor on your breakout board, and `V_FS` is the full-scale sense voltage: 0.325 V when the `vsense` bit in `CHOPCONF` is 0, or 0.180 V when it is 1. The `+ 0.02 Ω` accounts for internal resistance in the chip.

Most common breakout boards — BigTreeTech, Fysetc, and similar — use a 0.11 Ω sense resistor. Plugging that in with `vsense = 0` and `CS = 31` gives a maximum of about 1.77 A RMS, which is above the chip's 1.4 A RMS continuous rating, so you will not be using the top of the range. With `vsense = 1` the full-scale drops to about 0.98 A RMS, giving finer resolution over a lower range, which usually suits the smaller joints.

The practical procedure: work out your motor's RMS rating, decide on 60–80% of it as a starting point (you can always raise it), pick `vsense` so that your target lands in the upper half of the available range for best resolution, solve the formula for `CS`, and set `IRUN` to that. Set `IHOLD` to somewhere between a third and a half of `IRUN`. Then run the arm and put your hand on the motors after ten minutes.

## 6.5 Hold current, standstill, and heat

`TPOWERDOWN` sets how long after the last step the driver waits before ramping the current down from `IRUN` to `IHOLD`. `IHOLDDELAY` sets how gradually that ramp happens — a smooth ramp avoids the small position shift you get if the current drops abruptly.

For a robot arm, think about which joints actually need holding torque at rest. J2 and J3 are carrying the weight of the arm and will backdrive if you cut their current — they need meaningful hold current, or a mechanical brake, or a parked position where gravity is not fighting them. J1 rotates about a vertical axis and has essentially no gravity load, so it can hold at very low current. J4, J5, and J6 carry only the wrist and tool.

Tune this per joint rather than applying one global number — every watt you do not dissipate is a watt not heating a plastic bracket.

## 6.6 Power, wiring, and the mistakes that kill drivers

These are the failure modes that destroy hardware, in rough order of how often they happen.

**Disconnecting a motor while powered.** The winding is an inductor carrying current. Break that circuit and the inductor generates whatever voltage it takes to keep current flowing, which is a very large voltage, and it appears across the driver's output transistors. This kills drivers instantly and reliably, so do not unplug a stepper with the supply on.

**Insufficient bulk capacitance.** Each driver needs a substantial electrolytic capacitor across its VM and GND pins, physically close to the chip — 100 µF or more per driver is a sensible target, and the breakout board's own tiny capacitor is not sufficient. Without it, the switching currents the driver draws cause the local supply to sag and ring, and the resulting voltage spikes exceed the chip's rating. Observe the polarity — a reversed electrolytic vents.

**Regenerative overvoltage.** When a loaded joint decelerates, the motor acts as a generator and pumps energy back into the supply. On an unloaded bench supply this raises the rail voltage, sometimes dramatically. A 24 V supply against a 29 V driver rating leaves some margin, but a heavily loaded J2 doing a fast stop can use it up. Large bulk capacitance absorbs most of this; if the problem persists, a transient voltage suppressor across the rail is cheap.

**Powering the logic before the motor supply, or vice versa.** Some drivers dislike having VIO present with VM absent, or the reverse. The TMC2209 is reasonably tolerant, but the safe arrangement is to bring both up together from one supply arrangement, and to make sure the Teensy is not trying to drive STEP/DIR/EN into an unpowered driver.

**Ground layout.** Subtler, and behind most intermittent problems. Motor currents are large and they switch fast. If those currents share a ground path with your logic signals, the voltage drops they create appear as noise on your logic. The rule is star grounding: power ground and logic ground meet at exactly one point, ideally at the power supply. Keep motor wires physically away from signal wires, and if they must run together, use twisted pairs and consider shielding. A single ground loop through the USB cable back to your computer can inject enough noise to corrupt UART traffic to the drivers.

**Missing EN control.** Wire the drivers' enable pins to a Teensy output, and make sure the Teensy drives them to the disabled state at reset. The EN pin on the TMC2209 is active-low, meaning low enables the driver. A Teensy pin at reset is an input with no pull, so it floats — and a floating EN pin is a coin flip. Fit a pull-up resistor from EN to VIO so that the drivers are *disabled* by default, and only enable them once the firmware has decided everything is ready.

# Chapter 7 — The TMC2209 in detail

## 7.1 What it is

The TMC2209 is a Trinamic (now part of Analog Devices) stepper driver with an integrated power stage. It handles one bipolar stepper, up to 2 A peak per phase or about 1.4 A RMS continuous, from a supply of 4.75 V to 29 V. Its distinguishing features are StealthChop2 for silent operation, SpreadCycle for high-speed torque, StallGuard4 for sensorless load measurement, CoolStep for automatic current reduction, MicroPlyer interpolation to 1/256, and a single-wire UART interface that gives you full register-level control.

The UART is what makes it a good fit for a robot arm rather than a 3D printer: you can set current per joint from software, read back driver diagnostics, tune StallGuard for homing, and detect faults, all without touching a screwdriver.

## 7.2 The pins, and what each one does

Grouped by function:

**Power pins**

`VM` is the motor supply, 4.75 to 29 V. This is the rail the H-bridges switch, and where your bulk capacitor goes. `GND` is the power return. `VCP` is the charge-pump capacitor pin — the driver needs a voltage above VM to fully turn on its high-side N-channel transistors, and it generates that with a charge pump requiring an external capacitor to VM. `5VOUT` is an internal 5 V regulator output; it powers the chip's own logic and can supply a small amount externally, and it needs a decoupling capacitor. `VREF` is the analogue current-reference input discussed in Chapter 6. `VIO` is the logic supply, and whatever you put on it sets the logic level of all the digital pins. Connect it to the Teensy's 3.3 V and every digital pin becomes 3.3 V logic, safe for the Teensy. Connect it to 5 V, as many 3D printer boards do, and the driver's outputs will drive 5 V into your Teensy and damage it.

**Motor output pins**

`OA1`, `OA2` are the two ends of coil A. `OB1`, `OB2` are coil B. The two wires of a single coil must go to OA1/OA2 as a pair; split a coil across the two outputs and the motor vibrates without turning. If you are unsure which wires pair up, measure resistance between them — the two ends of one coil read a couple of ohms, and wires from different coils read open circuit. Swapping the two wires within a pair simply reverses that phase, which reverses the motor's direction — a legitimate way to fix a joint that homes the wrong way if you would rather not do it in software.

`BRA`, `BRB` are the sense-resistor connections. On a breakout board these are already wired to the sense resistors and you do not touch them.

**Step/direction control pins**

`STEP` advances the microstep counter on each rising edge. `DIR` selects direction; it is sampled at the step edge, so it must be stable beforehand. `EN` is active-low enable: low turns the outputs on, high puts them in high-impedance and the motor freewheels. As discussed, pull it up so the default state is disabled.

**Configuration pins**

`MS1` and `MS2` do double duty, which is the most confusing part of the chip.

In **standalone mode**, where the driver runs without UART, MS1 and MS2 select the microstep resolution:

| MS2 | MS1 | Microsteps |
|---|---|---|
| 0 | 0 | 1/8 |
| 0 | 1 | 1/2 |
| 1 | 0 | 1/4 |
| 1 | 1 | 1/16 |

Note that these are the *input* step resolutions; with MicroPlyer interpolation, the driver internally runs at 1/256 regardless, so the motor motion is smooth even at 1/2 input stepping. Note also that the ordering is not the obvious one: MS2=0, MS1=1 gives 1/2, not 1/4.

In **UART mode**, MS1 and MS2 stop being microstep selectors — microstepping moves to the `MRES` field of the `CHOPCONF` register — and instead become the **address pins**. MS1 is address bit 0 and MS2 is address bit 1, giving four addresses, 0 through 3. This is how you put multiple drivers on one UART line.

`PDN_UART` is the single-wire UART pin. In standalone mode it is a power-down input with a specific meaning; the moment you connect a UART to it, it becomes the bidirectional serial line.

`SPREAD` selects the chopper mode in standalone: high for SpreadCycle, low for StealthChop. In UART mode this is overridden by the `en_spreadcycle` bit in `GCONF`.

`CLK` is an optional external clock input. Left unconnected, the chip uses its internal ~12 MHz oscillator, which is fine for almost everything. Feed it an accurate external clock only if you need repeatable chopper and StallGuard behaviour across temperature, which is worth remembering if StallGuard thresholds drift as the driver warms up.

**Output pins**

`DIAG` is a push-pull output that signals either a StallGuard stall or a driver error, depending on configuration. This is the pin you wire to a Teensy input for sensorless homing; Chapter 8 covers it.

`INDEX` outputs a pulse each time the microstep counter passes position zero — that is, once per full step boundary in the sine table. It can be reconfigured to output other internal signals. It is useful for verification: count INDEX pulses against the full steps you think you commanded and you have an independent check that the driver is stepping.

## 7.3 The single-wire UART

The TMC2209's UART is unusual in that it uses one wire for both directions. Both the master and the slave transmit on the same line, taking turns.

To connect it to a Teensy, you have two options. The simple one is to tie the Teensy's TX and RX for that port together through a 1 kΩ resistor and connect the junction to `PDN_UART`. The resistor prevents the Teensy's driver from fighting the TMC2209's when the driver replies, and the Teensy sees its own transmissions echoed back, which you simply discard. The alternative is to connect TX through a 1 kΩ resistor to PDN_UART and RX directly, which achieves the same thing with slightly cleaner signal integrity.

Multiple drivers share the line. Each is given a distinct address by strapping its MS1 and MS2 pins, and each ignores datagrams addressed to another. Four drivers per UART is the limit, so a six-axis arm needs two UART ports: for example `Serial1` carrying J1–J4 at addresses 0–3, and `Serial2` carrying J5 and J6 at addresses 0 and 1.

The protocol is simple enough to learn, and when something is not working you will want to read the bytes.

A **write** is eight bytes: a sync byte of `0x05`, the slave address, the register address with its top bit set to indicate a write, four data bytes most-significant first, and a CRC byte.

A **read request** is four bytes: sync `0x05`, slave address, register address with the top bit clear, and CRC. The driver replies with eight bytes: sync `0x05`, the master address `0xFF`, the register address, four data bytes, and a CRC.

The CRC is an 8-bit CRC with polynomial x⁸ + x² + x + 1, processed least-significant-bit first. The datasheet gives the reference implementation:

```c
uint8_t tmc_crc(const uint8_t *data, uint8_t len) {
  uint8_t crc = 0;
  for (uint8_t i = 0; i < len; i++) {
    uint8_t b = data[i];
    for (uint8_t j = 0; j < 8; j++) {
      if ((crc >> 7) ^ (b & 0x01)) crc = (crc << 1) ^ 0x07;
      else                          crc = (crc << 1);
      b >>= 1;
    }
  }
  return crc;
}
```

The sync byte's low nibble contains a fixed `0101` pattern that the driver uses for automatic baud-rate detection, so you do not need to configure a baud rate on the driver — it works it out from the sync byte. 115200 baud is a sensible choice and is what most libraries default to.

One very useful register is `IFCNT` at address `0x02`. It counts successfully received write datagrams. Read it before and after a write, and if it did not increment, the write did not land — which settles the question of whether the UART wiring is right.

## 7.4 The registers you will actually use

The TMC2209 has a lot of registers. These are the ones that matter for a robot arm.

`GCONF` (0x00) is the global configuration. The bits you care about are `i_scale_analog` (bit 0 — set to 0 to use the internal reference and ignore VREF), `en_spreadcycle` (bit 2 — 0 for StealthChop, 1 for SpreadCycle), `shaft` (bit 3 — inverts motor direction in software, useful when a joint homes the wrong way), `index_step` (bit 6 — makes INDEX output step pulses instead of the zero-position marker), and `mstep_reg_select` (bit 7 — set this to take microstep resolution from the register rather than from the MS1/MS2 pins, which you must do when using UART).

`GSTAT` (0x01) reports reset, driver error, and undervoltage since last read. Reading it clears it. Poll it occasionally — a driver that has quietly reset has lost its configuration.

`IFCNT` (0x02) is the write counter described above.

`IHOLD_IRUN` (0x10) packs `IHOLD` in bits 0–4, `IRUN` in bits 8–12, and `IHOLDDELAY` in bits 16–19. This is the register you write to set current.

`TPOWERDOWN` (0x11) sets the delay before dropping to hold current.

`TSTEP` (0x12) is read-only and reports the measured time between steps, in units of the internal clock. It is how the chip knows how fast the motor is going, and it is what the velocity thresholds compare against. A large `TSTEP` means slow.

`TPWMTHRS` (0x13) is the velocity threshold above which the driver leaves StealthChop for SpreadCycle. Because it is expressed in `TSTEP` units, larger numbers mean *lower* crossover speeds. Set it to 0 to disable the automatic switch entirely.

`TCOOLTHRS` (0x14) is the lower velocity limit for StallGuard and CoolStep. Below this speed — meaning `TSTEP` greater than `TCOOLTHRS` — StallGuard is disabled and DIAG will not fire. It exists because StallGuard is unreliable at very low speeds, and it is the setting most often forgotten when sensorless homing does not work.

`VACTUAL` (0x22) lets you command a constant velocity using the driver's own internal step generator, without sending any STEP pulses at all. It is a useful debugging tool: write a value and the motor spins, which exercises power, wiring, current, and the driver independently of your step-generation code. Set it back to 0 to return control to the STEP pin.

`SGTHRS` (0x40) is the StallGuard threshold, and `SG_RESULT` (0x41) is the StallGuard load measurement. Chapter 8 is about these.

`COOLCONF` (0x42) configures CoolStep.

`CHOPCONF` (0x6C) holds the chopper configuration, including `TOFF` in bits 0–3 (which must be non-zero for the driver to operate at all — setting it to 0 is how you disable the driver in software), `vsense` at bit 17, `MRES` in bits 24–27 for microstep resolution, and `intpol` at bit 28 to enable MicroPlyer interpolation.

The `MRES` encoding is: 0 = 1/256, 1 = 1/128, 2 = 1/64, 3 = 1/32, 4 = 1/16, 5 = 1/8, 6 = 1/4, 7 = 1/2, 8 = full step. Note that it counts *down*. For the PAROL6's 1/32 microstepping you write `MRES = 3`.

`DRV_STATUS` (0x6F) is the diagnostic register, and the one worth polling periodically. It contains the live `SG_RESULT` in bits 0–9, over-temperature pre-warning `otpw` at bit 26, over-temperature shutdown `ot` at bit 25, short-to-ground flags for each coil, short-to-supply flags, open-load flags, a set of temperature threshold flags at 120/143/150/157 °C, the actual current scale `CS_ACTUAL` in bits 16–20, a `stealth` flag at bit 30 showing which chopper mode is active, and `stst` at bit 31 indicating standstill.

`PWMCONF` (0x70) configures StealthChop. The defaults with `pwm_autoscale` and `pwm_autograd` enabled are good; leave them alone unless you have a specific reason.

## 7.5 A configuration sequence

Bringing up a TMC2209 over UART works best in a fixed order. Power up with EN held high so the driver is disabled. Wait a few milliseconds for the internal regulator to stabilise. Read `IFCNT` and note it. Write `GCONF` with `i_scale_analog = 0`, `mstep_reg_select = 1`, and StealthChop selected. Read `IFCNT` again and confirm it incremented; if it did not, fix the wiring before going further. Write `CHOPCONF` with `TOFF` non-zero (3 to 5 is typical), `MRES = 3` for 1/32, and `intpol = 1`. Write `IHOLD_IRUN` with your computed currents. Write `TPOWERDOWN`. Write `TPWMTHRS` if you want the SpreadCycle crossover. Read `DRV_STATUS` and confirm no fault flags. Only then pull EN low to enable the outputs.

Done per driver, with the `IFCNT` check at each stage, this turns "the arm doesn't move" into a fault you can locate.

# Chapter 8 — StallGuard, CoolStep, and sensorless homing

## 8.1 What StallGuard measures

StallGuard is easier to use once you know what it measures, so the principle comes before the registers.

When a stepper turns, the rotor's magnets moving past the stator coils induce a back-EMF in those coils. The magnitude of that back-EMF depends on speed, and its *phase relative to the driving current* depends on load. Under no load, the rotor sits very close to the field position and the phase relationship is one thing. Under increasing load, the rotor lags further and further behind the rotating field — this is the load angle — and the phase relationship shifts correspondingly. At the point where the load angle reaches 90 electrical degrees, the motor produces maximum torque; beyond that it loses synchronism and stalls.

StallGuard measures that phase relationship, indirectly, by observing the coil voltages during the chopper cycle. It reports the result as `SG_RESULT`, a number from 0 to 510. **High means lightly loaded, low means heavily loaded.** As the motor approaches a stall, `SG_RESULT` falls towards zero.

StallGuard4, which is the version in the TMC2209, is designed to work with StealthChop. This is a change from the older StallGuard2, which required SpreadCycle. For the TMC2209 the recommendation is to use StealthChop when you want StallGuard to work well.

## 8.2 The registers and the stall condition

`SG_RESULT` at register 0x41 gives you the raw measurement. It updates once per full step, so at low step rates you get relatively few samples.

`SGTHRS` at register 0x40 is a threshold from 0 to 255. The driver declares a stall — and asserts DIAG — when:

$$
\texttt{SG\_RESULT} \le 2 \times \texttt{SGTHRS}
$$

So a higher `SGTHRS` means a *more sensitive* detector, triggering on lighter loads. The direction is easy to get backwards.

`TCOOLTHRS` at register 0x14 gates the whole thing. StallGuard output to DIAG is only active when the motor is running faster than the velocity corresponding to `TCOOLTHRS` — that is, when the measured `TSTEP` is less than or equal to `TCOOLTHRS`. Forget to set `TCOOLTHRS` and DIAG never fires — StallGuard is not broken, it is disabled.

The reason for this gate is that StallGuard is unreliable at very low speeds, where there is not enough back-EMF to measure, and it also misbehaves at very high speeds. There is a usable band in the middle, and your homing speed needs to be inside it.

## 8.3 What makes StallGuard hard to tune

StallGuard is sensitive to a lot of things, which is why it has a reputation for being fiddly.

`SG_RESULT` depends on **speed** — the same physical load reads differently at different velocities, which is why you must home at a fixed, repeatable speed. It depends on **motor current** — change `IRUN` and your threshold no longer applies. It depends on **supply voltage**, so a sagging rail shifts your readings. It depends on the **specific motor**, since inductance and back-EMF constant vary between part numbers and even between units. And it depends on the **mechanics**: a joint with a stiff belt, a tight gearbox, or a bearing that binds slightly at one end of travel will show a lower baseline `SG_RESULT` in that region, which can look like a stall.

On a geared robot joint there is an extra complication. The reduction between motor and joint means the motor sees the mechanical stop through 20:1 of gearbox. The gearbox has compliance and friction of its own, and the load rise when the joint hits its stop is softened and delayed. StallGuard on a directly-driven axis is much crisper than on a heavily geared one, which means tuning per joint rather than globally.

## 8.4 A practical tuning procedure

Do this once per joint, and write the numbers down.

Start by configuring the driver in StealthChop with your final running current — the current you will actually use — and set `TCOOLTHRS` to a large value so StallGuard is enabled across a wide speed range while you experiment.

Now move the joint at your intended homing speed, away from any obstruction, and log `SG_RESULT` continuously. You are looking for the free-running baseline. It should be fairly steady; note the value and note how much it varies over the joint's travel. That variation is your noise floor, and it limits how tight a threshold you can use.

Next, run the joint slowly into its mechanical stop and watch `SG_RESULT` fall. Note the value at which it clearly and repeatably drops. You now have two numbers: a free-running baseline and a stalled value.

Set `SGTHRS` to roughly halfway between them, divided by two (since the comparison is against `2 × SGTHRS`). Then test it: home the joint twenty times and confirm it triggers every time, and never triggers spuriously during free motion. Nineteen times out of twenty is not good enough for something the rest of the machine's positioning depends on.

Finally, set `TCOOLTHRS` so that StallGuard is active at your homing speed but inactive at your normal operating speeds. You do not want a fast move that momentarily encounters high load to be interpreted as a stall.

Repeat for every joint, at that joint's own homing speed and current.

## 8.5 Wiring and reading DIAG

The DIAG pin is a push-pull output referenced to VIO, so with VIO at 3.3 V it is directly Teensy-safe. Give each driver its own Teensy input pin rather than wire-ORing them — you have the pins, and knowing *which* axis stalled is more useful than knowing one of them did.

You can attach an interrupt to it, which is the right approach for a fast reaction. Two things to note: DIAG is a level rather than a pulse, so it stays asserted while the stall condition persists; and during normal motion, especially acceleration, you may see brief assertions. A short debounce — require the line to stay asserted for a few hundred microseconds — removes most false triggers without adding meaningful latency.

Also note that DIAG can be configured to signal driver *errors* rather than stalls, and in some configurations both. If your DIAG line asserts the instant you enable the driver, check `DRV_STATUS` for an over-temperature or short flag before assuming it is a stall.

## 8.6 The homing state machine

A sensorless homing routine for one joint looks like this in outline.

Configure the driver: StealthChop, homing current, appropriate `TCOOLTHRS`, tuned `SGTHRS`. Enable the driver and wait briefly for the current to settle. Now accelerate the joint towards the hard stop, but **do not enable stall detection during the acceleration phase** — acceleration loads the motor, `SG_RESULT` drops, and you trigger immediately. Wait until you are at constant homing speed, then arm the detector.

Move until DIAG asserts, or until you have travelled more than the joint's full range, at which point abort rather than continue pushing. On detection, stop immediately, back off by a fixed small amount, and optionally repeat the approach at a lower speed for better repeatability — the classic two-pass home. Set the joint's position counter to the known angle of that hard stop. Disarm stall detection, restore normal running current, and move to a safe standby position.

Then do the next joint. Order matters: home the joints that can crash into things last, or arrange the sequence so that each joint is homed in a configuration where its motion is unobstructed. On a six-axis arm, homing J2 and J3 while the arm is folded up can drive links into each other.

## 8.7 Should you use sensorless homing at all?

On a robot arm I would use it as a *secondary* system rather than the primary one.

The PAROL6 uses limit switches for its open-loop homing. A limit switch triggers at the same physical point every time, regardless of temperature, supply voltage, or gearbox condition, and StallGuard's trigger point moves with all of those. For a machine whose accuracy rests on knowing where zero is, that difference in repeatability matters.

Where StallGuard earns its place is as a **safety and diagnostic layer**. Monitor `SG_RESULT` continuously during normal operation and you have a real-time measure of how hard each joint is working. A sudden drop means a collision, and stopping the arm within a few milliseconds is worth having for the sake of both the arm and whatever it hit. A gradual drift downward over weeks means a bearing is going or a belt is over-tensioned. A limit switch tells you neither.

So: limit switches for homing, StallGuard for collision detection and condition monitoring, and CoolStep on top if you want the current management.

## 8.8 CoolStep

CoolStep uses the same `SG_RESULT` measurement for a different purpose: automatic current adjustment. You configure a window with `SEMIN` and `SEMAX` in the `COOLCONF` register. When `SG_RESULT` rises above the window — meaning the motor is lightly loaded — the driver reduces current. When it falls below, the driver increases current back up to `IRUN`.

The effect is that a motor which spends most of its time lightly loaded runs cool, and only draws full current when it actually needs the torque. On a PETG-framed arm with a documented thermal limit, that is worth having.

The caveats are that CoolStep requires the same velocity gating as StallGuard via `TCOOLTHRS`, and that it needs `SG_RESULT` to be well-behaved, which means you should tune StallGuard first. It also changes current dynamically, so any StallGuard threshold tuned at fixed current no longer holds. Until you are confident, use one or the other on a given joint during a given operation rather than both.

# Chapter 9 — Frames, rotations, and homogeneous transforms

## 9.1 Why we need frames at all

The question "where is the gripper?" has no answer until you say "relative to what". A robot arm is a chain of rigid bodies, and the natural way to describe it is to attach a coordinate frame to each body and then describe how each frame relates to the one before it. The position of the tool relative to the table is then just the composition of all those relationships.

A **frame** is an origin point plus three mutually perpendicular unit vectors, conventionally x, y, and z, forming a right-handed set. When we say "the pose of the end effector", we mean the position of its frame's origin and the orientation of its axes, both expressed in some reference frame — usually the base frame, sitting at the bottom of the robot.

Pose therefore has six numbers: three for position and three for orientation. Six degrees of freedom — which is why a six-axis arm is the canonical design, six joints being exactly the number needed to reach an arbitrary position *and* an arbitrary orientation within the workspace.

## 9.2 Rotation matrices

The cleanest way to represent orientation for computation is a 3×3 rotation matrix. Its columns are the unit vectors of the rotated frame's axes, expressed in the reference frame. So if $R$ is the rotation of frame B relative to frame A, the first column of $R$ is B's x-axis written in A's coordinates.

Rotation matrices have properties that make them pleasant to work with. They are orthonormal: every column is a unit vector, and all columns are mutually perpendicular. Consequently the inverse of a rotation matrix is simply its transpose, which is free to compute. Their determinant is exactly $+1$. And they compose by multiplication: if $R_{AB}$ rotates from A to B and $R_{BC}$ from B to C, then $R_{AC} = R_{AB} \cdot R_{BC}$.

The elementary rotations about the three axes are worth memorising:

$$
R_x(\theta) = \begin{bmatrix}
1 & 0 & 0 \\
0 & \cos\theta & -\sin\theta \\
0 & \sin\theta & \cos\theta
\end{bmatrix}
\qquad
R_y(\theta) = \begin{bmatrix}
\cos\theta & 0 & \sin\theta \\
0 & 1 & 0 \\
-\sin\theta & 0 & \cos\theta
\end{bmatrix}
$$

$$
R_z(\theta) = \begin{bmatrix}
\cos\theta & -\sin\theta & 0 \\
\sin\theta & \cos\theta & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

Note the sign pattern in $R_y$ — it is the odd one out, and transcribing it wrongly gives kinematics that are wrong only in certain poses.

## 9.3 Euler angles

Nine numbers to describe three degrees of freedom is redundant, so people often use three angles instead: roll, pitch, and yaw, or some other Euler convention. These are convenient for humans — "rotate 30° about z, then 45° about the new y" is easy to picture.

They have two problems. First, there are two dozen distinct Euler conventions in common use, differing in axis order and in whether rotations are about fixed or moving axes, and almost nobody states which one they mean. If your robot's orientation is off in a way that looks almost right, suspect a convention mismatch first.

Second, and more fundamentally, every three-angle representation has **singularities** — configurations where two of the angles become degenerate and only their sum or difference is determined. This is gimbal lock, and it is not an implementation flaw — it is a topological necessity for any three-parameter representation of rotation.

For a robot arm this matters at the wrist. When joint 5 is at zero, joints 4 and 6 rotate about the same physical axis, and only their sum is determined by the desired orientation. The IK has infinitely many solutions and the solver has to decide what to do about it. It is a pose the arm will pass through in ordinary use, not a corner case.

**Quaternions** avoid the singularity by using four numbers with one constraint, and they interpolate cleanly, which makes them a good fit for orientation targets and for blending between orientations along a path. Use quaternions for storage and interpolation; convert to rotation matrices for the kinematics maths; use Euler angles only at the human interface.

## 9.4 Homogeneous transforms

The trick that makes robot kinematics tractable is to combine rotation and translation into a single 4×4 matrix:

$$
T = \begin{bmatrix} R & p \\ 0 & 1 \end{bmatrix}
$$

where $R$ is the 3×3 rotation and $p$ is the 3×1 translation. The bottom row is always $\begin{bmatrix}0 & 0 & 0 & 1\end{bmatrix}$.

The reason is that composition becomes matrix multiplication. If $T_1$ describes frame 1 relative to frame 0, and $T_2$ describes frame 2 relative to frame 1, then $T_1 T_2$ describes frame 2 relative to frame 0. A chain of six joints becomes a product of six matrices, and that is forward kinematics.

Points transform too. Write a 3D point as a 4-vector with a 1 appended, and $T$ times that vector gives the point in the new frame, with rotation and translation applied together.

The inverse has a closed form you should use rather than calling a general matrix inverse:

$$
T^{-1} = \begin{bmatrix} R^{\mathsf{T}} & -R^{\mathsf{T}} p \\ 0 & 1 \end{bmatrix}
$$

It is exact and cheap, where a numerical 4×4 inversion is neither.

# Chapter 10 — Denavit–Hartenberg and the forward kinematics of the PAROL6

## 10.1 The problem DH solves

You could attach frames to a robot's links any way you like, and then write out each transform by hand. That works but it is error-prone and it means every robot needs bespoke code.

Denavit and Hartenberg observed that if you place the frames according to a specific set of rules, the transform between consecutive frames always has the same form and always requires exactly four parameters instead of six. That is the idea: a systematic frame placement that reduces each joint to four numbers.

The rules are: put the z-axis of frame $i$ along the axis of joint $i+1$ (so z is always the axis a joint rotates about, or slides along); put the x-axis of frame $i$ along the common perpendicular between $z_{i-1}$ and $z_i$; and y follows from the right-hand rule.

Given that placement, the four parameters are:

- **$\theta$** (theta) — the rotation about z that takes $x_{i-1}$ to $x_i$. For a revolute joint, this is the joint variable.
- **$d$** — the translation along z from $x_{i-1}$ to $x_i$. The link offset.
- **$a$** — the translation along x. The link length, or more precisely the distance between the two z-axes along their common perpendicular.
- **$\alpha$** (alpha) — the rotation about x that takes $z_{i-1}$ to $z_i$. The link twist.

And the transform is always:

$$
T_i = R_z(\theta) \cdot T_z(d) \cdot T_x(a) \cdot R_x(\alpha)
$$

which multiplies out to:

$$
T = \begin{bmatrix}
\cos\theta & -\sin\theta\cos\alpha & \sin\theta\sin\alpha & a\cos\theta \\
\sin\theta & \cos\theta\cos\alpha & -\cos\theta\sin\alpha & a\sin\theta \\
0 & \sin\alpha & \cos\alpha & d \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

It is worth being able to recognise this matrix on sight; every DH-based kinematics implementation contains it.

**A caution about conventions.** There are two DH variants in circulation: "standard" or "distal" DH, which is what I have written above, and "modified" or "proximal" DH, popularised by Craig, which orders the four elementary transforms differently and attaches frames to the proximal rather than distal end of each link. They are not interchangeable, and a table for one convention plugged into code for the other gives wrong answers that look plausible. Establish which convention a table uses before you use it. The one below is standard DH.

## 10.2 The PAROL6 DH table

The published link dimensions are:

| Symbol | Value (mm) | What it is |
|---|---|---|
| $a_1$ | 110.50 | Base height to shoulder axis |
| $a_2$ | 23.42 | Lateral offset at the shoulder |
| $a_3$ | 180.00 | Upper arm length |
| $a_4$ | 43.50 | Elbow offset |
| $a_5$ | 176.35 | Forearm length |
| $a_6$ | 62.80 | Wrist to flange along the tool axis |
| $a_7$ | 45.25 | Flange lateral offset |

And the DH table, in standard convention:

| i | Link | $\theta$ | $\alpha$ | $d$ (mm) | $a$ (mm) |
|---|---|---|---|---|---|
| 1 | Base | $\theta_1$ | $-\pi/2$ | 110.50 | 23.42 |
| 2 | Shoulder | $\theta_2 - \pi/2$ | $\pi$ | 0 | 180.00 |
| 3 | Elbow | $\theta_3 + \pi$ | $\pi/2$ | 0 | −43.50 |
| 4 | Wrist 1 | $\theta_4$ | $-\pi/2$ | −176.35 | 0 |
| 5 | Wrist 2 | $\theta_5$ | $\pi/2$ | 0 | 0 |
| 6 | Wrist 3 | $\theta_6 + \pi$ | $\pi$ | −62.80 | −45.25 |

The $\theta$ column contains the joint variable plus a constant offset. Those offsets exist because the DH frame placement rules do not generally put the frames where a human would want "zero" to be. They are a bookkeeping device that lets the robot's zero position be something sensible while the maths stays in DH form.

## 10.3 Forward kinematics

Forward kinematics is now trivial to state: given the six joint angles, build the six transforms and multiply them.

$$
T_0^6 = T_1(\theta_1) \cdot T_2(\theta_2) \cdot T_3(\theta_3) \cdot T_4(\theta_4) \cdot T_5(\theta_5) \cdot T_6(\theta_6)
$$

The result is a 4×4 matrix whose top-right 3×1 block is the flange position in base coordinates and whose top-left 3×3 block is the flange orientation.

In code this is about twenty lines:

```python
import numpy as np

a1, a2, a3, a4, a5, a6, a7 = 110.50, 23.42, 180.00, 43.50, 176.35, 62.80, 45.25
pi = np.pi

# (theta_offset, alpha, d, a)
DH = [(0.0,   -pi/2,  a1,  a2),
      (-pi/2,  pi,    0.0, a3),
      (pi,     pi/2,  0.0, -a4),
      (0.0,   -pi/2, -a5,  0.0),
      (0.0,    pi/2,  0.0, 0.0),
      (pi,     pi,   -a6, -a7)]

def dh_transform(theta, alpha, d, a):
    ct, st = np.cos(theta), np.sin(theta)
    ca, sa = np.cos(alpha), np.sin(alpha)
    return np.array([[ct, -st*ca,  st*sa, a*ct],
                     [st,  ct*ca, -ct*sa, a*st],
                     [0,      sa,     ca,    d],
                     [0,       0,      0,    1]])

def forward_kinematics(q):
    """q: six joint angles in radians. Returns 4x4 base-to-flange transform."""
    T = np.eye(4)
    for i, (off, alpha, d, a) in enumerate(DH):
        T = T @ dh_transform(q[i] + off, alpha, d, a)
    return T
```

Running it with all joints at zero places the flange at approximately (262.6, 0.0, 288.7) mm, and with the arm extended it reaches about 396 mm from the base axis, which agrees with the published 400 mm figure and suggests the table is transcribed correctly.

## 10.4 Verifying your implementation

Three checks catch almost every error in kinematics code.

**Check the reach.** Extend the arm as far as it will go and confirm the flange distance from the base matches the specification. If your link lengths or your α signs are wrong, the reach will be visibly wrong.

**Check the wrist intersection.** The PAROL6 has a spherical wrist, meaning the axes of joints 4, 5, and 6 all pass through a common point. If you compute the origins of frames 4 and 5 for arbitrary joint angles, they should be identical. I have verified this holds for the table above. If it does not hold in your implementation, you have a transcription error, and the closed-form IK in the next chapter will not work.

**Check the round trip.** Pick random joint angles, run forward kinematics to get a pose, run inverse kinematics on that pose, and run forward kinematics again on the result. The two poses must match to within numerical noise. The joint angles need not match, since there are multiple solutions, but the poses must. Do this for a few thousand random configurations; it is the test worth writing first.

## 10.5 The tool frame

Everything above computes the pose of the **flange**, the mounting face at the end of the arm. What you usually want is the **tool centre point**, somewhere out in front of the gripper.

Handle this with one more transform. Define $T_{\text{flange}}^{\text{tool}}$ describing where the TCP sits relative to the flange, and then:

$$
T_{\text{base}}^{\text{tool}} = T_{\text{base}}^{\text{flange}} \cdot T_{\text{flange}}^{\text{tool}}
$$

Keep this separate from the DH chain, so that changing grippers changes one matrix and nothing else. Baking the tool offset into the DH table costs you that the first time you swap end effectors.

Similarly, if the robot is bolted to a table and you want to work in table coordinates, define $T_{\text{world}}^{\text{base}}$ and pre-multiply. The full chain is then world → base → flange → tool, and each piece has a clear physical meaning and a clear owner.

# Chapter 11 — Inverse kinematics: from a pose in space to six joint angles

## 11.1 The problem

Forward kinematics is a function: joint angles in, exactly one pose out. Inverse kinematics is a relation: a pose in, and no solutions, several, or infinitely many out.

No solutions happens when the pose is outside the workspace, or inside it but unreachable with the required orientation, or blocked by joint limits. Several solutions is the normal case — a six-axis arm of this type generally has **eight** distinct joint configurations that put the tool in exactly the same place with exactly the same orientation. Infinitely many happens at singularities.

The solver has to handle all three cases explicitly. An IK routine that returns one answer with no indication of whether it is valid will eventually drive the arm into itself.

## 11.2 Kinematic decoupling: the key insight

A spherical wrist is worth building because it splits the six-dimensional problem into two three-dimensional ones that can be solved independently.

The axes of joints 4, 5, and 6 all intersect at a single point, the **wrist centre**. Rotating any of those three joints rotates the tool about that point but does not move the point. Therefore the position of the wrist centre depends *only* on joints 1, 2, and 3.

So: given a desired tool pose, first compute where the wrist centre must be. That depends only on the desired position and orientation, both of which you know. Then solve joints 1, 2, and 3 to place the wrist centre there — a pure positioning problem in three unknowns with a geometric solution. Then, knowing joints 1–3, compute what rotation the wrist must supply to make up the difference between what the arm gives you and what you asked for, and solve joints 4, 5, and 6 for that rotation — a pure orientation problem in three unknowns.

Two three-DOF problems instead of one six-DOF problem, both with closed-form solutions — which is why almost every industrial six-axis arm has a spherical wrist.

## 11.3 Step one: locate the wrist centre

The wrist centre sits at a fixed offset from the flange, expressed in the flange's own frame. For the PAROL6 DH table above, I computed that offset numerically and it comes out as a constant, as it must:

$$
\begin{aligned}
p_{wc} &= p_{\text{flange}} + R_{\text{flange}} \cdot \begin{bmatrix} a_7 & 0 & -a_6 \end{bmatrix}^{\mathsf{T}} \\
       &= p_{\text{flange}} + R_{\text{flange}} \cdot \begin{bmatrix} 45.25 & 0 & -62.80 \end{bmatrix}^{\mathsf{T}}
\end{aligned}
$$

I verified this at many arbitrary joint configurations and the offset vector expressed in frame 6 is exactly (45.25, 0, −62.80) mm every time.

If you are targeting a TCP rather than a flange, first convert: $T_{\text{base}}^{\text{flange}} = T_{\text{base}}^{\text{tool}} \cdot \big(T_{\text{flange}}^{\text{tool}}\big)^{-1}$, then apply the above.

```python
def wrist_centre(R, p):
    return p + R @ np.array([a7, 0.0, -a6])
```

That line is the whole of the decoupling step, and everything downstream depends on it.

## 11.4 Step two: joints 1, 2, and 3

Now you have a point, and you need the first three joints to put the wrist centre there.

**Joint 1.** There is a subtlety here that is easy to get wrong, and I got it wrong on my first pass through this derivation before the numerical check caught it. The $a_2 = 23.42$ mm offset at the shoulder looks like it should be a *lateral* offset — the kind that shifts the arm's plane sideways off the base axis and forces a correction term into $\theta_1$. It is not. Working through the DH table, the origin of frame 1 sits at $(a_2\cos\theta_1,\; a_2\sin\theta_1,\; a_1)$, which is displaced **radially outward** in the direction the arm is already pointing, not sideways. The arm's plane of motion therefore still contains the base's vertical axis.

Which means joint 1 is simply:

$$
\theta_1 = \operatorname{atan2}(y_{wc},\, x_{wc})
$$

with no correction term at all. The second solution is $\theta_1 + \pi$, the "shoulder flipped" configuration in which the arm reaches back over its own base. On the PAROL6, joint 1 is limited to ±123.05°, so many flipped solutions fall outside the joint limits and get discarded — which is normal and expected.

It is a good argument for checking numerically rather than trusting a derivation that looks right: the wrong version produces plausible angles that do not reach the target.

**Joints 2 and 3** are then a planar two-link problem in the vertical plane containing the arm. Convert the wrist centre into that plane's coordinates:

$$
\begin{aligned}
u &= \sqrt{x_{wc}^2 + y_{wc}^2} - a_2 &&\text{horizontal distance from the shoulder axis} \\
v &= a_1 - z_{wc} &&\text{note the sign — the frame-1 y axis points downward}
\end{aligned}
$$

For the flipped-shoulder branch, use $u = -\sqrt{x_{wc}^2 + y_{wc}^2} - a_2$ instead.

The two links are the upper arm, $a_3 = 180.00$ mm, and the forearm. The forearm is not a straight link — there is a 43.50 mm offset at the elbow and a 176.35 mm length beyond it — so its effective length is the hypotenuse, and it carries a fixed built-in bend:

$$
\begin{aligned}
L &= \sqrt{a_4^2 + a_5^2} = \sqrt{43.50^2 + 176.35^2} = 181.636 \text{ mm} \\
\varphi &= \operatorname{atan2}(a_4, a_5) = \operatorname{atan2}(43.50, 176.35) = 0.24184 \text{ rad} = 13.856°
\end{aligned}
$$

Now the standard two-link solution. Let $D^2 = u^2 + v^2$. The law of cosines gives the included angle $B$ between the two links:

$$
\cos B = \frac{D^2 - a_3^2 - L^2}{2 \, a_3 L}
$$

If the magnitude of that cosine exceeds 1, the point is out of reach — too far, or too close for the elbow to fold around — and you must return "no solution" rather than letting `acos` produce a NaN that propagates silently into your motor commands. Check it explicitly, every time.

Otherwise there are two solutions, the **elbow-up** and **elbow-down** configurations:

$$
\begin{aligned}
B &= \pm \arccos\left(\frac{D^2 - a_3^2 - L^2}{2 \, a_3 L}\right) \\
A &= \operatorname{atan2}(v, u) - \operatorname{atan2}\big(L\sin B,\; a_3 + L\cos B\big)
\end{aligned}
$$

And then the conversion from these geometric angles to the actual joint variables, which absorbs the DH $\theta$-offsets and the forearm's built-in bend:

$$
\begin{aligned}
\theta_2 &= A + \pi/2 \\
\theta_3 &= \pi/2 - \varphi - B
\end{aligned}
$$

Those two lines are where the sign errors live. I derived them by computing forward kinematics on a grid of $(\theta_2, \theta_3)$ values and fitting the relationship rather than by reasoning on paper, and I would do the same if you change the geometry — it takes ten minutes and it is correct by construction.

## 11.5 Step three: joints 4, 5, and 6

With $\theta_1$, $\theta_2$, and $\theta_3$ known, compute the rotation the arm has produced up to frame 3:

```python
R_0_3 = fk([th1, th2, th3, 0, 0, 0])[1][2][:3, :3]
```

The wrist must supply whatever rotation gets you from there to the target:

```python
R_3_6 = R_0_3.T @ R_target
```

Now, joints 4, 5, and 6 form a Z–Y–Z-like Euler sequence in frame 3, but the $\alpha$ values in the DH table ($-\pi/2$, $+\pi/2$, $\pi$) and the $+\pi$ offset on joint 6 mean the extraction is not the textbook ZYZ formula. Multiplying the three rotation matrices out symbolically gives:

$$
R_3^6 = \begin{bmatrix}
\cdot & \cdot & -\sin\theta_5 \cos\theta_4 \\
\cdot & \cdot & -\sin\theta_5 \sin\theta_4 \\
\sin\theta_5 \cos\theta_6 & \sin\theta_5 \sin\theta_6 & -\cos\theta_5
\end{bmatrix}
$$

from which the extraction follows directly. Writing $r_{ij}$ for the elements of $R_3^6$, with rows and columns numbered from 1:

$$
\begin{aligned}
\theta_5 &= \operatorname{atan2}\left(\sqrt{r_{13}^2 + r_{23}^2},\; -r_{33}\right) \\
\theta_4 &= \operatorname{atan2}(-r_{23},\, -r_{13}) \\
\theta_6 &= \operatorname{atan2}(r_{32},\, r_{31})
\end{aligned}
$$

I have verified these numerically against the forward kinematics over thousands of random configurations; they reproduce the original pose to within $2 \times 10^{-12}$ mm. Note the minus signs — they come from the $\alpha = \pi$ rows in the DH table and they are not present in the standard textbook ZYZ formula. Apply the textbook version to this table and you get an answer that is wrong in a way that looks almost right.

The second solution — the **wrist-flipped** configuration — is:

$$
\theta_4' = \theta_4 + \pi, \qquad \theta_5' = -\theta_5, \qquad \theta_6' = \theta_6 + \pi
$$

which reaches the same orientation by rotating joint 5 the other way and spinning joints 4 and 6 half a turn each. I have verified this branch too; it is exact.

**The wrist singularity.** When $\sin\theta_5$ approaches zero, the axes of joints 4 and 6 become collinear. Both $r_{13}$ and $r_{23}$ go to zero, `atan2(0, 0)` is undefined, and the split between $\theta_4$ and $\theta_6$ is arbitrary — only their sum matters. Detect it by testing whether $\sqrt{r_{13}^2 + r_{23}^2}$ is below a small threshold, and when it is, hold $\theta_4$ at its current value and put all the rotation into $\theta_6$. That gives continuous motion rather than a flip.

## 11.5a A complete, verified implementation

The whole closed-form solver, tested end-to-end. Over 5,000 random configurations it produces every valid solution branch, and every returned solution reproduces the target pose to within $2.3 \times 10^{-13}$.

```python
import numpy as np

a1, a2, a3, a4, a5, a6, a7 = 110.50, 23.42, 180.00, 43.50, 176.35, 62.80, 45.25
pi = np.pi
L   = np.hypot(a4, a5)        # 181.636 mm
PHI = np.arctan2(a4, a5)      # 0.24184 rad

def wrap(x):
    return (x + pi) % (2 * pi) - pi

def ik(R, p):
    """R: 3x3 target orientation. p: target flange position (mm).
       Returns a list of [th1..th6] in radians — up to 8 branches."""
    pw = p + R @ np.array([a7, 0.0, -a6])      # wrist centre
    x, y, z = pw
    r = np.hypot(x, y)
    out = []

    for th1, sgn in ((np.arctan2(y, x), 1.0),
                     (wrap(np.arctan2(y, x) + pi), -1.0)):
        u = sgn * r - a2
        v = a1 - z
        c = (u*u + v*v - a3*a3 - L*L) / (2 * a3 * L)
        if abs(c) > 1.0:
            continue                            # out of reach on this branch

        for s in (+1.0, -1.0):                  # elbow up / elbow down
            B  = s * np.arccos(np.clip(c, -1.0, 1.0))
            A  = np.arctan2(v, u) - np.arctan2(L*np.sin(B), a3 + L*np.cos(B))
            th2 = wrap(A + pi/2)
            th3 = wrap(pi/2 - PHI - B)

            R03 = forward_kinematics_frames([th1, th2, th3, 0, 0, 0])[2][:3, :3]
            R36 = R03.T @ R
            r13, r23, r33 = R36[0, 2], R36[1, 2], R36[2, 2]
            r31, r32      = R36[2, 0], R36[2, 1]
            sf = np.hypot(r13, r23)

            if sf < 1e-8:                       # wrist singularity
                th5 = 0.0 if -r33 > 0 else pi
                th4 = 0.0
                th6 = wrap(np.arctan2(R36[1, 0], R36[0, 0]))
                out.append([th1, th2, th3, th4, th5, th6])
                continue

            th5 = np.arctan2(sf, -r33)
            th4 = np.arctan2(-r23, -r13)
            th6 = np.arctan2(r32, r31)
            out.append([th1, th2, th3, th4, th5, th6])
            out.append([th1, th2, th3, wrap(th4 + pi), -th5, wrap(th6 + pi)])

    return out
```

`forward_kinematics_frames` is the function from Chapter 10.3, modified to return the list of accumulated transforms rather than just the last one.

A note on joint-limit conventions: the published PAROL6 limits (J2 from −145.01° to −3.38°, J3 from +107.87° to +287.87°) are expressed in the robot's own user-facing convention, which may differ by a constant offset or a sign from the DH joint variables above. Establish the mapping empirically — command a known angle, measure the physical joint — before you use the published limits as software limits.

## 11.6 The eight solutions, and choosing between them

Multiply out the choices: two for shoulder (forward or flipped), two for elbow (up or down), two for wrist (normal or flipped). Eight configurations, all reaching exactly the same tool pose.

A complete IK routine computes all eight, then filters and ranks them.

**Filter** by joint limits first. The PAROL6's limits are: J1 ±123.05°, J2 from −145.01° to −3.38°, J3 from 107.87° to 287.87°, J4 ±105.47°, J5 ±90°, and J6 continuous. Any solution with a joint outside its range is discarded outright.

**Filter** next by self-collision, if you have a collision model. More work to implement, and what stops the arm folding into itself.

**Rank** the survivors. The usual criterion is a weighted sum of joint motion from the current configuration:

$$
\text{cost} = \sum_i w_i \left| \theta_i^{\text{new}} - \theta_i^{\text{current}} \right|
$$

with larger weights on the big proximal joints, because moving J2 costs far more time and energy than moving J6. Pick the lowest-cost solution.

Add one more consideration: **configuration continuity**. Along a continuous path, you want the arm to stay in one configuration rather than jumping between them. A jump from elbow-up to elbow-down mid-path is geometrically valid and produces a large, fast, unexpected motion. Prefer solutions in the same configuration branch as the previous point, and allow a branch change only deliberately, at a controlled speed, as an explicit reconfiguration move.

## 11.7 The numerical alternative

Closed-form IK is fast and complete, but it only exists because of the spherical wrist and it must be re-derived if you change the geometry. The alternative is to solve numerically.

Start from a guess at the joint angles. Compute forward kinematics. Measure the error between the resulting pose and the target — three components of position error, three of orientation error. Use the Jacobian (next chapter) to work out which way to move the joints to reduce that error. Take a step. Repeat until converged.

The naïve version uses the Jacobian inverse and blows up near singularities, where the Jacobian becomes ill-conditioned and the computed joint step becomes enormous. The standard fix is **damped least squares**, also called the Levenberg–Marquardt method:

$$
\Delta q = J^{\mathsf{T}} \left( J J^{\mathsf{T}} + \lambda^2 I \right)^{-1} e
$$

The damping factor $\lambda$ limits the step size near singularities at the cost of some accuracy. Adaptive schemes increase $\lambda$ when the condition number is bad and reduce it when things are well-behaved.

Numerical IK is slower — tens to hundreds of iterations — but it handles arbitrary geometry, it naturally incorporates joint limits and secondary objectives, and it degrades gracefully. On a 600 MHz Cortex-M7 you can run it in real time without difficulty.

**My recommendation**: implement the closed-form solution, which is exact, fast, and gives you all eight configurations, then implement a numerical solver as a fallback and an independent check. Where the two disagree, one of them has a bug.

# Chapter 12 — The Jacobian, velocities, and singularities

## 12.1 What the Jacobian is

The Jacobian is the matrix that relates joint velocities to end-effector velocities:

$$
v = J(q) \, \dot{q}
$$

where $\dot{q}$ is the six-vector of joint angular velocities, and $v$ is the six-vector of end-effector velocity — three components of linear velocity and three of angular velocity. $J$ is a 6×6 matrix that depends on the current configuration $q$.

Each column of $J$ tells you what happens to the end effector when you move one joint at unit speed with all others held still. For a revolute joint $i$ with axis direction $z_i$ and origin $o_i$, and with the end effector at position $p$, that column is:

$$
J_i = \begin{bmatrix} z_i \times (p - o_i) \\ z_i \end{bmatrix}
\begin{matrix} \leftarrow \text{linear velocity} \\ \leftarrow \text{angular velocity} \end{matrix}
$$

All the quantities on the right are available from the forward kinematics computation you have already done, so building the Jacobian costs almost nothing extra. Compute the transforms, accumulate them, and read off the z-axis and origin of each frame.

## 12.2 What you use it for

**Cartesian velocity control.** If you want the tool to move at a specified velocity in space — say, 50 mm/s along the table's x-axis while maintaining orientation — solve $\dot{q} = J^{-1} v$. This is the basis of jogging in tool coordinates, and of any velocity-level control.

**Force and torque relationships.** By the principle of virtual work, the transpose of the Jacobian maps forces at the tool to torques at the joints: $\tau = J^{\mathsf{T}} F$. That tells you how much joint torque a given payload demands in a given configuration, which is what you need to check whether your motors and gearboxes are adequate at the worst-case pose. It also underlies force control and compliance, if you ever add sensing.

**Numerical IK**, as described above.

**Singularity detection**, which is next.

## 12.3 Singularities

A singularity is a configuration where the Jacobian loses rank — where its determinant goes to zero. Physically, it means the arm has lost the ability to move instantaneously in some direction, no matter how it moves its joints. Approaching one, $J^{-1}$ grows without bound, and the joint velocities required for a modest tool velocity become impossible.

A six-axis arm of this type has three families of singularity.

**Wrist singularity**, when joint 5 is at or near zero and the axes of joints 4 and 6 align. This is the common one, because $\theta_5 = 0$ is an ordinary-looking pose — the wrist straight. Passing through it during a Cartesian move sends joints 4 and 6 spinning rapidly in opposite directions.

**Shoulder singularity**, when the wrist centre lies on the axis of joint 1. Here, joint 1 can rotate freely without moving the wrist centre at all, so the arm has lost a degree of freedom in that direction. Near it, small tool motions demand very large joint-1 velocities.

**Elbow singularity**, when the arm is fully extended and the shoulder, elbow, and wrist centre are collinear. At full extension the arm cannot move further outward, and the boundary of the workspace is itself a singular surface.

## 12.4 Living with singularities

Singularities are intrinsic to a six-axis serial arm, so the question is how to handle them rather than how to remove them.

**Detect them.** The cleanest measure is the smallest singular value of $J$, obtained from a singular value decomposition. A more common and cheaper measure is Yoshikawa's manipulability index, $w = \sqrt{\det(J J^{\mathsf{T}})}$, which goes to zero at a singularity. Compute it along a planned path *before* executing and you know in advance whether the path is safe.

**Avoid them in planning.** When you plan a Cartesian path, check manipulability at each waypoint. If the path passes close to a singularity, either reroute it or accept a joint-space move through that region instead.

**Damp near them.** If you must operate near a singularity, use the damped least squares pseudo-inverse rather than the true inverse. The tool will not follow the commanded path exactly — you trade accuracy for boundedness — but the joints will not attempt impossible velocities.

**Clamp joint velocities.** Put a hard limit on commanded joint velocity in the motion pipeline, at a layer below the planner, and do not let anything above it bypass the limit. If the IK or the Jacobian produces something absurd, the clamp catches it and the arm slows rather than flinging itself.

**Prefer joint-space moves where you can.** A great deal of robot motion — going from one point to another where the path between does not matter — can be done in joint space, interpolating each joint linearly from start to end. Joint-space moves have no singularity problems, because you never invert the Jacobian. Reserve Cartesian interpolation for the parts of the task that need a straight line in space.

# Chapter 13 — From joint angles to step counts

## 13.1 The conversion

This is the bridge between the kinematics and the hardware. The arithmetic is trivial; getting the conventions right is not.

$$
\text{microsteps} = \frac{\theta_{\text{joint}}\,(\text{degrees})}{360} \times 200 \times \text{microstepping} \times \text{gear ratio}
$$

The 200 is full steps per motor revolution. The microstepping is 32 on the PAROL6. The gear ratio converts joint revolutions to motor revolutions.

Working it through for each joint, with 200 × 32 = 6400 microsteps per motor revolution:

| Joint | Ratio | Microsteps per joint rev | Microsteps per degree | Angle per microstep |
|---|---|---|---|---|
| J1 | 6.4 | 40,960 | 113.78 | 0.00879° (31.6″) |
| J2 | 20 | 128,000 | 355.56 | 0.00281° (10.1″) |
| J3 | 18.1 | 115,840 | 321.78 | 0.00311° (11.2″) |
| J4 | 4 | 25,600 | 71.11 | 0.01406° (50.6″) |
| J5 | 4 | 25,600 | 71.11 | 0.01406° (50.6″) |
| J6 | 10 | 64,000 | 177.78 | 0.00563° (20.3″) |

A single microstep on joint 1 rotates the arm by 0.0088°, which at the full 400 mm reach moves the tool by about 0.061 mm. On joint 2 it is 0.0028°, or about 0.020 mm at full reach. Every joint's quantisation is comfortably below the arm's quoted 0.1 mm repeatability.

Which is the point from Chapter 5 with numbers behind it: **microstep resolution is not what limits this machine's accuracy.** Backlash, belt stretch, structural flex in printed PETG, and thermal expansion all dominate, and that is where the effort goes if you want a more accurate arm.

## 13.2 Rounding, and why you must accumulate

The conversion produces a non-integer number of microsteps, and you cannot send a fraction of a step. If you round each move independently, the rounding errors accumulate over thousands of moves and the arm slowly drifts away from where it thinks it is.

The fix is to keep the authoritative position as an **integer microstep count** per joint, and to convert the *target* angle to an integer microstep count, then command the difference. The residual fraction never accumulates because you never store a fractional position — the integer count is the truth, and the angle is derived from it, not the other way round.

```python
STEPS_PER_DEG = [113.778, 355.556, 321.778, 71.111, 71.111, 177.778]

def angle_to_steps(joint, degrees):
    return int(round(degrees * STEPS_PER_DEG[joint]))

def steps_to_angle(joint, steps):
    return steps / STEPS_PER_DEG[joint]
```

Do the same on the Teensy side, with `int32_t` counters. A 32-bit signed integer holds ±2.1 billion microsteps, which at 128,000 per revolution of joint 2 is over sixteen thousand revolutions.

## 13.3 Direction and zero

Two per-joint constants complete the picture: a **direction sign** and a **zero offset**.

The direction sign accounts for how the motor happens to be wired and mounted, and whether positive joint rotation corresponds to positive or negative step direction. Keep it as an explicit `+1` or `−1` in a configuration table rather than fixing it by swapping motor wires, so that the reason is still visible in six months.

The zero offset is the microstep count corresponding to the joint's defined zero. After homing, you set the counter to the value corresponding to the known angle of the home position, and everything else follows. The PAROL6's published joint limits give both the range and the standby position for each joint, and those are the numbers to encode.

Keep all of this — steps per degree, direction sign, home angle, soft limits, maximum velocity, maximum acceleration, driver current — in a single per-joint configuration structure. One table, one place to change things, one thing to print when you are debugging.

## 13.4 Soft limits

Enforce joint limits in software, in microstep units, at the lowest level of the motion pipeline. The planner, the IK, and the host software should all check too, but the last check belongs in the step generator, where nothing can bypass it.

The check is one comparison per axis per segment. In exchange, no bug in the planner, no corrupted command from the host, and no arithmetic error in the IK can drive a joint past its mechanical stop — which on a printed arm is printed plastic.

# Chapter 14 — Trajectory generation and the real-time motion pipeline

## 14.1 The layers

A complete motion pipeline for the VCP6 has five layers, and it is much easier to reason about when they stay separate.

At the top is the **task layer**: "pick up the object at these coordinates". This is application logic and it lives on the host.

Below that is the **path layer**, which turns a task into a sequence of poses in space — waypoints, and the type of motion between them.

Below that is the **trajectory layer**, which adds time. It takes the geometric path and produces a schedule: at time t, the tool should be here, moving at this velocity. This is where speed limits, acceleration limits, and smoothing live.

Below that is the **kinematics layer**, which converts each sampled point on the trajectory into six joint angles via IK, and then into microstep targets.

And at the bottom is the **step generation layer**: the fixed-rate ISR from Chapter 3, consuming segments and producing pulses.

The boundary that matters most is between the kinematics layer and the step generator, since that is where soft real time meets hard real time. Everything above it can take variable time and occasionally be slow; everything below it must not miss a deadline. The ring buffer between them absorbs the difference, and its depth is the margin — enough segments buffered that a hiccup upstream does not starve the ISR.

## 14.2 Joint-space versus Cartesian moves

There are two ways to get from pose A to pose B, and a controller wants both.

A **joint-space move** interpolates each joint angle linearly from start to finish, scaled so that all joints start and stop together. It is simple, it is fast, it never encounters a singularity, and it uses the arm's full speed capability. What it does not do is move the tool in any predictable path — the tool traces a curve through space that depends on the geometry, and that curve can swing surprisingly wide. Use joint-space moves when the path does not matter, which is most of the time.

A **Cartesian move** interpolates the tool pose itself, typically along a straight line for position and by spherical linear interpolation for orientation, then runs IK at each sample point. The tool follows a predictable path in space, which is what you need for approaching a part, inserting something, or dispensing along a line. The costs are that it requires IK at every sample, that it can hit singularities mid-path, and that the required joint velocities vary along the path in ways that can exceed limits.

The standard industrial pattern is to use Cartesian moves only for the short, precise segments near the workpiece, and joint-space moves for everything else. Approach a pick point with a fast joint move to a position 50 mm above it, then a slow Cartesian move straight down — faster and safer than doing the whole thing in Cartesian space.

## 14.3 Velocity profiles

A stepper asked to go instantly from rest to 20,000 steps per second will not go: the rotor cannot accelerate that fast, it falls out of sync with the field, and it stalls or skips. Every move needs a velocity profile.

The **trapezoidal** profile is the classic: accelerate at a constant rate to a cruise velocity, hold, then decelerate at a constant rate to a stop. Velocity is a trapezoid, acceleration is a square wave. It is simple, optimal in the minimum-time sense given acceleration limits, and what most CNC controllers use.

Its drawback is that acceleration changes instantaneously at the corners of the trapezoid, and the rate of change of acceleration — **jerk** — is therefore infinite at those points. Infinite jerk excites structural resonance. On a rigid steel machine that is tolerable; on a 3D-printed arm with belt drives and a 400 mm reach it produces a visible wobble at the tool, and the settling time eats whatever the profile gained.

The **S-curve** profile ramps the acceleration itself, so that acceleration rises smoothly to its maximum, holds, and falls smoothly back. Jerk is bounded. Moves take slightly longer in theory, but on a compliant structure they often finish *sooner* in practice, because there is nothing to wait for at the end. For the VCP6 I would use S-curve profiles from the start.

The profile applies to the move as a whole, not per joint. Compute the time-optimal profile subject to every joint's velocity and acceleration limits — that is, find the joint that is the binding constraint, profile for that, and scale all the others to match — so that all joints start and stop together and the path is preserved.

## 14.4 The segment queue

The interface between the planner and the ISR should be a queue of small, fixed-duration segments. Each segment says: for the next N ticks, axis 1 gets this step increment, axis 2 gets this one, and so on, with these direction bits.

Segment duration is a design choice. Something in the region of 1 to 10 milliseconds works well: short enough that velocity changes are smooth, long enough that the planner is not overwhelmed. At 5 ms per segment and a queue depth of 200, you have a full second of buffered motion, which is comfortably more than any upstream hiccup will consume.

Make the queue a lock-free single-producer, single-consumer ring buffer: only the planner writes, only the ISR reads, the head and tail indices are `volatile`, and no locking is required.

Decide what happens when the queue **runs dry**. Stopping instantly is a step change in velocity and loses position; decelerating at the configured limit and flagging an underrun does not. Log the underruns — if they happen during normal operation, the planner is too slow or the queue too shallow.

## 14.5 Emergency stop

Every motion system needs a stop path that nothing else can block.

A **controlled stop** decelerates at maximum rate and keeps position tracking valid. This is what a software stop command, a soft limit violation, or a communication watchdog timeout should trigger. The arm stops in a controlled way and still knows where it is.

An **immediate stop** kills the driver enable lines. Position tracking is lost — the arm will coast and may drop under gravity — and re-homing is required. This is what a hardware emergency stop button does, and it should work whether or not the firmware is running: a physical contactor in the motor supply, not a Teensy input pin. The most likely reason you need one is that the software has gone wrong, which is exactly when a software-only stop will not help.

Wire both. Use the controlled stop for everything you can, and keep the immediate stop as the thing that works when nothing else does.

# Chapter 15 — System architecture: host, Teensy, drivers

## 15.1 Where to put each piece

You have a fast microcontroller and, presumably, a much faster PC. Where the work runs is a genuine choice, with two defensible answers.

**Thin Teensy, thick host.** The PC does path planning, trajectory generation, and inverse kinematics, and streams joint-space or even step-space commands to the Teensy at some fixed rate. The Teensy runs the step generator and the safety checks and nothing else. This is easy to develop — you get to write your motion planning in Python with proper debugging tools and visualisation — and it is how PAROL6's own software stack is arranged.

The weakness is dependency. The arm cannot move without the PC, and any hiccup in the PC's scheduling — a garbage collection pause, a Windows update deciding to do something — shows up as a gap in the command stream. Deep buffering hides most of this.

**Thick Teensy, thin host.** The Teensy holds the kinematic model and does IK itself. The host sends high-level commands: move to this pose, at this speed. The Teensy is autonomous and deterministic.

This is more work to build and harder to debug, since you are developing numerical code on an embedded target. The result is an arm that works regardless of what the PC is doing, can run a stored program with no host at all, and has a single coherent notion of its own state.

**My suggestion is to start thin and migrate.** Build the host-side stack first: you will iterate on the kinematics many times, and doing that in Python is far quicker than doing it in C++ on a microcontroller. Once the kinematics are settled and verified, port the IK to the Teensy — a few hundred lines, and the Cortex-M7 runs it in tens of microseconds. Keep the host path working as a development and diagnostic route.

## 15.2 What the Teensy must own regardless

Some responsibilities belong on the Teensy no matter which architecture you choose, because they must work when the host does not.

Step generation and timing. Soft limit enforcement. The communication watchdog that stops the arm if the host goes quiet. Driver fault monitoring — polling `DRV_STATUS` for over-temperature and short-circuit flags and reacting. Emergency stop handling. And the authoritative position counters, because if the host and the Teensy disagree about where the arm is, the Teensy is the one holding the actual step counts.

## 15.3 A suggested pin allocation

A sketch rather than a prescription, but it shows how comfortably it fits.

Six STEP pins and six DIR pins takes twelve. A single shared enable takes one, though giving each driver its own enable costs six pins and buys you per-axis control — worth it. Six DIAG inputs take six. Six limit switch inputs take six. Two UART pairs for the drivers take four. A gripper output takes one or two.

That is somewhere around thirty-five pins out of fifty-five, leaving room for status LEDs, an emergency stop input, an encoder or two if you go closed-loop later, and expansion.

On placement: put the six STEP pins on the same GPIO port if you can, so a single register write sets them all at once. That removes the small skew between axes that comes from setting pins one at a time, which matters for multi-axis coordination. Check the Teensy pin card for which pins map to which of the fast GPIO ports. Keep the UART pins away from the step pins physically on the board and in your wiring, since the step lines are the fastest-switching signals in the system and will couple into anything adjacent.

## 15.4 Grounding and cable routing, again

Chapter 6 covered this, and it deserves a second pass at the point where you are laying out the real machine.

Motor cables carry amps of fast-switching current and they radiate. Signal cables — especially the UART lines to the drivers, and the DIAG lines — are high-impedance and receptive. Run them apart. Where they must cross, cross at right angles. Twist motor pairs together, which cancels most of the radiated field. If you have persistent problems, use shielded cable for the motors with the shield grounded at one end only.

Ground the system at a single star point. Every ground return — driver power ground, Teensy ground, limit switch commons, the shield — meets at one physical location, and nowhere else. Ground loops turn a working bench setup into an intermittently failing assembled robot, and they are much easier to avoid up front than to diagnose afterwards.

# Chapter 16 — Bring-up order and a debugging checklist

## 16.1 Bring it up in this order

Each stage below is a place where a fault is easy to find. Assemble everything first and the faults compound.

**Stage one: the Teensy alone.** Blink an LED. Confirm you can program it, that the USB serial link works, and that the clock speed is what you think. Ten minutes.

**Stage two: one driver, on the bench, no arm.** One TMC2209, one motor, a bench supply, nothing mechanical attached. Get UART communication working and verify it by reading `IFCNT` and watching it increment. Then use the `VACTUAL` register to spin the motor from the driver's own internal step generator, which exercises power, wiring, current setting, and the driver without involving your step-generation code. Only when that works, switch to STEP/DIR pulses from the Teensy.

**Stage three: one driver, tuning.** Still on the bench, with the motor coupled to something with a bit of inertia. Set current properly and check the motor's temperature after ten minutes of running. Try StealthChop and SpreadCycle and listen to the difference. Log `SG_RESULT` while loading the shaft by hand, to get a feel for the numbers.

**Stage four: six drivers.** Add the rest, with addresses strapped correctly. Confirm you can talk to each individually: read a distinctive register value back from each and check you get six different answers rather than the same one six times, which is what wrong addressing looks like. Run all six motors simultaneously and check your step ISR timing with the cycle counter and, ideally, an oscilloscope on the step lines.

**Stage five: one joint, mechanically assembled.** Now attach a motor to an actual joint. Verify direction. Verify that the commanded angle matches the measured angle — put a protractor on it, command 90°, and measure. Gear ratio errors show up here, and are otherwise invisible until the IK produces nonsense. Home the joint and check repeatability over twenty cycles.

**Stage six: the full arm, joint space only.** All six joints, homing sequence working, joint-space moves working, soft limits enforced. No IK yet. Move each joint through its range and confirm nothing collides.

**Stage seven: forward kinematics.** Command a set of joint angles, compute where the FK says the tool should be, and *measure* it. A ruler and a fixed reference point are enough to catch a gross error. Do this at several poses across the workspace.

**Stage eight: inverse kinematics.** Round-trip test in software first — thousands of random poses, FK then IK then FK, confirming the poses match. Only then command Cartesian moves on the real arm — slowly, in open space, away from anything you mind hitting.

**Stage nine: speed and tuning.** Now raise velocities and accelerations, tune the profiles, and find where the arm starts to lose steps or wobble. Back off from that point with margin.

## 16.2 Symptom-to-cause checklist

**Motor makes noise but does not turn, or vibrates in place.** Usually a coil pairing error, with one coil split across the two driver outputs. Power off, measure resistance between wire pairs, and re-pair them. Can also be a current setting far too low.

**Motor turns but loses steps under load.** Current too low, acceleration too high, supply voltage too low, or the motor undersized for the load. Try in that order. Raising the supply voltage helps specifically at speed.

**Motor gets very hot.** Current too high, or hold current not being reduced at standstill. Check `IHOLD` and `TPOWERDOWN`, against the PETG thermal limits.

**Driver does nothing at all, no response over UART.** Check `IFCNT`. If it does not increment, the UART is not getting through: check the 1 kΩ series resistor, check the address straps on MS1/MS2, check that VIO is powered, check RX/TX are not swapped. If `IFCNT` does increment but the motor is dead, check that `TOFF` in `CHOPCONF` is non-zero and that EN is actually low.

**Driver was working, now unresponsive.** Read `GSTAT`. If the reset flag is set, the driver has restarted and lost its configuration, so detect that and reconfigure. If the driver-error flag is set, read `DRV_STATUS` for the specific fault.

**Intermittent UART corruption.** Usually noise coupling from motor wiring, or a ground loop. Separate the cables. Check the star ground. Lower the baud rate as a diagnostic — if it fixes it, you have a signal integrity problem, not a protocol problem.

**StallGuard never triggers.** `TCOOLTHRS` not set, so stall detection is disabled — the most common cause by some margin. Then homing speed outside the usable band. Then `SGTHRS` set too low, higher being more sensitive.

**StallGuard triggers immediately.** Probably armed during acceleration. Wait until you reach constant homing speed. Also check that DIAG is not signalling a driver error rather than a stall.

**Arm reaches the right position but the wrong orientation.** Euler angle convention mismatch, or a sign error in one of the α values in the DH table. Check the wrist frames specifically.

**IK works in some poses and not others.** Usually the "out of reach" branch is unhandled and a NaN from `acos` is propagating; add explicit range checks. Can also be joint limits filtering out all eight solutions, which should return "unreachable in this configuration" rather than failing silently.

**The arm makes a sudden large motion mid-path.** A configuration change: the IK jumped between solution branches. Add continuity preference to your solution selection.

**Motion is jerky or the arm wobbles at the end of a move.** Trapezoidal profile with infinite jerk exciting the structure. Switch to S-curve. Also check that your segment queue is not underrunning.

**Position drifts over many moves.** Rounding accumulation. Make integer microstep counts authoritative, as in Chapter 13.2.

# Appendix A — Teensy 4.1 serial port pin map

| Port | RX | TX | Notes |
|---|---|---|---|
| `Serial` | — | — | USB CDC, 480 Mbit/s, baud argument ignored |
| `Serial1` | 0 | 1 | |
| `Serial2` | 7 | 8 | |
| `Serial3` | 15 | 14 | RX/TX order reversed |
| `Serial4` | 16 | 17 | |
| `Serial5` | 21 | 20 | RX/TX order reversed |
| `Serial6` | 25 | 24 | RX/TX order reversed |
| `Serial7` | 28 | 29 | |
| `Serial8` | 34 | 35 | Teensy 4.1 only; second-row pins |

Useful methods beyond the standard Arduino set: `addMemoryForRead(buf, n)`, `addMemoryForWrite(buf, n)`, `availableForWrite()`, `attachRts(pin)`, `attachCts(pin)`, `transmitterEnable(pin)` for RS-485, and `clear()` to flush the receive buffer.

Always confirm against the current PJRC pin card for your board revision before wiring.

# Appendix B — TMC2209 register cheat sheet

| Address | Name | R/W | Purpose |
|---|---|---|---|
| 0x00 | `GCONF` | RW | `i_scale_analog` b0, `en_spreadcycle` b2, `shaft` b3, `index_step` b6, `mstep_reg_select` b7 |
| 0x01 | `GSTAT` | R+clear | reset / drv_err / uv_cp flags |
| 0x02 | `IFCNT` | R | Increments on each successful write; use to verify the UART |
| 0x03 | `SLAVECONF` | W | Reply delay |
| 0x06 | `IOIN` | R | Live state of the input pins; also chip version |
| 0x10 | `IHOLD_IRUN` | W | `IHOLD` b0–4, `IRUN` b8–12, `IHOLDDELAY` b16–19 |
| 0x11 | `TPOWERDOWN` | W | Delay before dropping to hold current |
| 0x12 | `TSTEP` | R | Measured time between steps (larger = slower) |
| 0x13 | `TPWMTHRS` | W | StealthChop → SpreadCycle crossover velocity |
| 0x14 | `TCOOLTHRS` | W | Lower velocity limit for StallGuard and CoolStep |
| 0x22 | `VACTUAL` | W | Internal step generator — spin the motor without STEP pulses |
| 0x40 | `SGTHRS` | W | StallGuard threshold; stall when `SG_RESULT ≤ 2 × SGTHRS` |
| 0x41 | `SG_RESULT` | R | Load measurement, 0–510; high = light load |
| 0x42 | `COOLCONF` | W | CoolStep `SEMIN`, `SEMAX`, `SEDN`, `SEUP` |
| 0x6A | `MSCNT` | R | Microstep counter position |
| 0x6C | `CHOPCONF` | RW | `TOFF` b0–3, `vsense` b17, `MRES` b24–27, `intpol` b28 |
| 0x6F | `DRV_STATUS` | R | `SG_RESULT` b0–9, `CS_ACTUAL` b16–20, `ot` b25, `otpw` b26, `stealth` b30, `stst` b31, plus short and open-load flags |
| 0x70 | `PWMCONF` | RW | StealthChop configuration |
| 0x71 | `PWM_SCALE` | R | Current StealthChop scaling — useful diagnostic |

**`MRES` encoding** (note it counts down): 0 = 1/256, 1 = 1/128, 2 = 1/64, 3 = 1/32, 4 = 1/16, 5 = 1/8, 6 = 1/4, 7 = 1/2, 8 = full step.

**Standalone MS1/MS2 microstep table**: (MS2, MS1) = (0,0) → 1/8, (0,1) → 1/2, (1,0) → 1/4, (1,1) → 1/16.

**UART addressing**: MS1 is address bit 0, MS2 is address bit 1. Four drivers maximum per UART line.

**Datagram formats**: write = `0x05`, addr, reg|0x80, data[4], CRC (8 bytes). Read request = `0x05`, addr, reg, CRC (4 bytes). Read reply = `0x05`, `0xFF`, reg, data[4], CRC (8 bytes). CRC-8, polynomial 0x07, LSB-first.

# Appendix C — PAROL6 numbers at a glance

**Mechanical**

| | |
|---|---|
| Reach | 400 mm with standard gripper |
| Payload | 1 kg near base, 0.5 kg across workspace |
| Weight | 5.5 kg |
| Repeatability | 0.1 mm |
| Material | 3D-printed PETG |
| Power | ~40 W |
| Microstepping | 1/32 on all axes |

**Link dimensions (mm)**

$a_1 = 110.50$ · $a_2 = 23.42$ · $a_3 = 180.00$ · $a_4 = 43.50$ · $a_5 = 176.35$ · $a_6 = 62.80$ · $a_7 = 45.25$

**DH table (standard convention)**

| i | $\theta$ | $\alpha$ | $d$ | $a$ |
|---|---|---|---|---|
| 1 | $\theta_1$ | $-\pi/2$ | 110.50 | 23.42 |
| 2 | $\theta_2 - \pi/2$ | $\pi$ | 0 | 180.00 |
| 3 | $\theta_3 + \pi$ | $\pi/2$ | 0 | −43.50 |
| 4 | $\theta_4$ | $-\pi/2$ | −176.35 | 0 |
| 5 | $\theta_5$ | $\pi/2$ | 0 | 0 |
| 6 | $\theta_6 + \pi$ | $\pi$ | −62.80 | −45.25 |

**Wrist centre offset**: $p_{wc} = p_{\text{flange}} + R_{\text{flange}} \cdot \begin{bmatrix} 45.25 & 0 & -62.80 \end{bmatrix}^{\mathsf{T}}$ mm

**Forearm effective length**: $L = 181.636$ mm, built-in bend $\varphi = 13.856°$

**Reductions, ranges, and resolution**

| Joint | Ratio | Range | Limits (°) | Microsteps/° |
|---|---|---|---|---|
| J1 | 6.4 (belt) | 250° | −123.05 … +123.05 | 113.78 |
| J2 | 20 (planetary) | 141° | −145.01 … −3.38 | 355.56 |
| J3 | 18.1 (planetary+belt) | 180° | +107.87 … +287.87 | 321.78 |
| J4 | 4 (belt) | 212° | −105.47 … +105.47 | 71.11 |
| J5 | 4 (belt) | 180° | −90 … +90 | 71.11 |
| J6 | 10 (planetary) | continuous | 0 … 360 | 177.78 |

Standby positions: J1 = 0°, J2 = −90°, J3 = 180°, J4 = 0°, J5 = 0°, J6 = 180°.

**Thermal limits (PETG)**: holding 48–61 °C, moving 52–73 °C. Reduce current in software for extended operation.

# Appendix D — Formula reference

**Steps from angle**

$$
\text{microsteps} = \frac{\theta°}{360} \times 200 \times \text{microstepping} \times \text{gear ratio}
$$

**TMC2209 RMS current**

$$
I_{\text{RMS}} = \frac{CS + 1}{32} \times \frac{V_{\text{FS}}}{R_{\text{sense}} + 0.02\,\Omega} \times \frac{1}{\sqrt{2}}
$$

$$
V_{\text{FS}} = 0.325\,\text{V} \;\; (\texttt{vsense} = 0) \qquad\text{or}\qquad 0.180\,\text{V} \;\; (\texttt{vsense} = 1)
$$

**StallGuard stall condition**

$$
\texttt{SG\_RESULT} \le 2 \times \texttt{SGTHRS} \qquad \text{and only while} \;\; \texttt{TSTEP} \le \texttt{TCOOLTHRS}
$$

**DH transform**

$$
T = \begin{bmatrix}
\cos\theta & -\sin\theta\cos\alpha & \sin\theta\sin\alpha & a\cos\theta \\
\sin\theta & \cos\theta\cos\alpha & -\cos\theta\sin\alpha & a\sin\theta \\
0 & \sin\alpha & \cos\alpha & d \\
0 & 0 & 0 & 1
\end{bmatrix}
$$

**Homogeneous transform inverse**

$$
T^{-1} = \begin{bmatrix} R^{\mathsf{T}} & -R^{\mathsf{T}} p \\ 0 & 1 \end{bmatrix}
$$

**PAROL6 inverse kinematics — verified**

Wrist centre:

$$
p_{wc} = p_{\text{flange}} + R_{\text{flange}} \cdot \begin{bmatrix} 45.25 & 0 & -62.80 \end{bmatrix}^{\mathsf{T}}
$$

Joint 1, with $+\pi$ for the flipped branch:

$$
\theta_1 = \operatorname{atan2}(y_{wc},\, x_{wc})
$$

Planar coordinates, taking the minus sign for the flipped branch:

$$
u = \pm\sqrt{x_{wc}^2 + y_{wc}^2} - a_2 \qquad v = a_1 - z_{wc}
$$

Constants:

$$
L = \sqrt{a_4^2 + a_5^2} = 181.636\,\text{mm} \qquad \varphi = \operatorname{atan2}(a_4, a_5) = 0.24184\,\text{rad} = 13.856°
$$

Joints 2 and 3 — no solution if $|\cos B| > 1$; the sign of $B$ selects elbow up or elbow down:

$$
\begin{aligned}
\cos B &= \frac{u^2 + v^2 - a_3^2 - L^2}{2 \, a_3 L} \\
A &= \operatorname{atan2}(v, u) - \operatorname{atan2}\big(L\sin B,\; a_3 + L\cos B\big) \\
\theta_2 &= A + \pi/2 \\
\theta_3 &= \pi/2 - \varphi - B
\end{aligned}
$$

Wrist, with $R_3^6 = \big(R_0^3\big)^{\mathsf{T}} R_{\text{target}}$:

$$
\begin{aligned}
\theta_5 &= \operatorname{atan2}\left(\sqrt{r_{13}^2 + r_{23}^2},\; -r_{33}\right) \\
\theta_4 &= \operatorname{atan2}(-r_{23},\, -r_{13}) \\
\theta_6 &= \operatorname{atan2}(r_{32},\, r_{31})
\end{aligned}
$$

The flipped branch is $\theta_4 + \pi$, $-\theta_5$, $\theta_6 + \pi$.

Verified by round trip against forward kinematics over 5,000 random poses: worst-case pose error $2.3 \times 10^{-13}$.

**Generic two-link planar IK** — link lengths $L_1$, $L_2$, target at distance $D$; no solution if $|\cos\theta_2| > 1$

$$
\begin{aligned}
\cos\theta_2 &= \frac{D^2 - L_1^2 - L_2^2}{2 L_1 L_2} \\
\theta_1 &= \operatorname{atan2}(y, x) - \operatorname{atan2}\big(L_2 \sin\theta_2,\; L_1 + L_2 \cos\theta_2\big)
\end{aligned}
$$

**Jacobian column for revolute joint $i$**

$$
J_i = \begin{bmatrix} z_i \times (p - o_i) \\ z_i \end{bmatrix}
$$

**Damped least squares IK step**

$$
\Delta q = J^{\mathsf{T}} \left( J J^{\mathsf{T}} + \lambda^2 I \right)^{-1} e
$$

**Manipulability**, which goes to zero at a singularity

$$
w = \sqrt{\det\big(J J^{\mathsf{T}}\big)}
$$

# Appendix E — Glossary

**Back-EMF** — voltage generated by a spinning motor that opposes the applied voltage; proportional to speed, and the reason stepper torque falls off at high speed.

**Bresenham / DDA** — an integer algorithm for distributing steps evenly over time across multiple axes; the basis of fixed-rate multi-axis step generation.

**Chopper** — the switching circuit that regulates winding current by rapidly switching the supply on and off.

**CoolStep** — Trinamic's automatic current reduction based on the StallGuard load measurement.

**DH parameters** — Denavit–Hartenberg; the four-parameter convention for describing each link of a serial manipulator.

**DIAG** — TMC2209 output pin signalling a stall or a driver fault.

**DTCM / ITCM** — Data and Instruction Tightly Coupled Memory; the fast, deterministic, cache-free RAM on the Cortex-M7.

**Full step** — one of the 200 natural positions per revolution of a 1.8° stepper.

**Hold current** — reduced current applied to a stationary motor to limit heating.

**IFCNT** — TMC2209 counter that increments on each successful UART write; how you confirm the UART is working.

**Jacobian** — the matrix relating joint velocities to end-effector velocity.

**Jerk** — rate of change of acceleration; unbounded in a trapezoidal profile, bounded in an S-curve.

**Kinematic decoupling** — splitting six-DOF IK into a position problem and an orientation problem, made possible by a spherical wrist.

**Load angle** — the angular lag between the rotor and the driving magnetic field; what StallGuard indirectly measures.

**Microplyer** — TMC2209 feature that interpolates incoming steps up to 1/256 microstepping internally.

**Microstep** — a subdivision of a full step produced by driving the two phases with intermediate currents.

**MRES** — the `CHOPCONF` field selecting microstep resolution.

**Pose** — position and orientation together; six numbers.

**Singularity** — a configuration where the arm loses the ability to move in some direction; the Jacobian loses rank.

**SpreadCycle** — Trinamic's current-regulated chopper mode; better dynamic response and high-speed torque.

**StallGuard** — Trinamic's sensorless load measurement, reported as `SG_RESULT`.

**StealthChop** — Trinamic's voltage-mode PWM; near-silent, lower dynamic response.

**TCOOLTHRS** — the velocity threshold that gates StallGuard and CoolStep; commonly forgotten.

**TCP** — Tool Centre Point; the point on the tool whose pose you control.

**TSTEP** — TMC2209 measurement of the time between steps; larger means slower.

**VREF** — analogue current-reference input; interacts with `IRUN` via the `i_scale_analog` bit.

---

## Sources

- [PAROL6 Documentation — Robot Specifications](https://source-robotics.github.io/PAROL-docs/page2_2/)
- [PAROL6 Documentation — General Concepts](https://source-robotics.github.io/PAROL-docs/page7/)
- [PAROL6 kinematic structure (Hackaday.io project log)](https://hackaday.io/project/191860-parol6-desktop-robotic-arm/log/222132-parol6-kinematic-structure)
- [PAROL6 Desktop Robot Arm — GitHub](https://github.com/Source-Robotics/PAROL6-Desktop-robot-arm)
- [Source Robotics — PAROL6](https://source-robotics.com/products/parol6-robotic-arm)

Register details, datagram formats, and current formulas should be confirmed against the current Trinamic/Analog Devices TMC2209 datasheet. Teensy 4.1 pin assignments should be confirmed against the PJRC pin card for your board revision.

# Appendix F — A runnable reference implementation

Chapters 10.3 and 11.5 give the forward and inverse kinematics in the form that reads most easily. This is the same maths in the form that runs: forward kinematics, the closed-form inverse, and the round-trip self-test in one file, with nothing elided.

Save it as `ik_full.py` and run it with NumPy installed. It draws 5,000 random joint configurations, puts each through forward kinematics to get a pose, solves that pose, and checks that **every** returned branch reproduces the original transform. On this machine it prints:

```text
round-trip worst err = 2.274e-13 | no-solution = 0 | mean #sols = 7.32
```

A worst-case error of $2.3 \times 10^{-13}$ is floating-point noise, `no-solution = 0` means no reachable pose was missed, and a mean of 7.3 solutions per pose is what the eight branches of Chapter 11.6 give once the near-singular configurations collapse a pair. An implementation that cannot reproduce these three numbers has something wrong with it, and this is the quickest way to find out.

```python
import numpy as np
a1,a2,a3,a4,a5,a6,a7=110.50,23.42,180.00,43.50,176.35,62.8,45.25
pi=np.pi
DH=[(0.0,-pi/2,a1,a2),(-pi/2,pi,0.0,a3),(pi,pi/2,0.0,-a4),
    (0.0,-pi/2,-a5,0.0),(0.0,pi/2,0.0,0.0),(pi,pi,-a6,-a7)]
L=np.hypot(a4,a5); PHI=np.arctan2(a4,a5)
def Tm(t,al,d,a):
    ct,st,ca,sa=np.cos(t),np.sin(t),np.cos(al),np.sin(al)
    return np.array([[ct,-st*ca,st*sa,a*ct],[st,ct*ca,-ct*sa,a*st],[0,sa,ca,d],[0,0,0,1]])
def fk(q):
    T=np.eye(4);Ts=[]
    for i in range(6):
        o,al,d,a=DH[i];T=T@Tm(q[i]+o,al,d,a);Ts.append(T.copy())
    return T,Ts
def wrap(x): return (x+pi)%(2*pi)-pi

def ik(R,p):
    pw=p+R@np.array([a7,0.0,-a6])
    x,y,z=pw; out=[]
    r=np.hypot(x,y)
    for th1,sgn in ((np.arctan2(y,x),1.0),(wrap(np.arctan2(y,x)+pi),-1.0)):
        u=sgn*r-a2; v=a1-z
        D2=u*u+v*v
        c=(D2-a3*a3-L*L)/(2*a3*L)
        if abs(c)>1: continue
        for s in (+1.0,-1.0):
            B=s*np.arccos(np.clip(c,-1,1))
            A=np.arctan2(v,u)-np.arctan2(L*np.sin(B),a3+L*np.cos(B))
            th2=wrap(A+pi/2); th3=wrap(pi/2-PHI-B)
            _,Ts=fk([th1,th2,th3,0,0,0])
            R36=Ts[2][:3,:3].T@R
            r13,r23,r33,r31,r32=R36[0,2],R36[1,2],R36[2,2],R36[2,0],R36[2,1]
            sf=np.hypot(r13,r23)
            if sf<1e-8:
                th5=0.0 if -r33>0 else pi; th4=0.0
                th6=wrap(np.arctan2(R36[1,0],R36[0,0]))
                out.append([th1,th2,th3,th4,th5,th6]); continue
            th5=np.arctan2(sf,-r33)
            th4=np.arctan2(-r23,-r13); th6=np.arctan2(r32,r31)
            out.append([th1,th2,th3,th4,th5,th6])
            out.append([th1,th2,th3,wrap(th4+pi),-th5,wrap(th6+pi)])
    return out

if __name__=="__main__":
    rng=np.random.default_rng(7); worst=0; nofind=0; counts=[]
    for _ in range(5000):
        q=rng.uniform(-2.5,2.5,6)
        T,_=fk(q); R,p=T[:3,:3],T[:3,3]
        sols=ik(R,p); counts.append(len(sols))
        if not sols: nofind+=1; continue
        best=min(np.abs(fk(s)[0]-T).max() for s in sols)
        worst=max(worst,best)
        # every returned solution must be exact
        allerr=max(np.abs(fk(s)[0]-T).max() for s in sols)
        if allerr>1e-6: print("BAD sol", allerr); break
    print("round-trip worst err = %.3e | no-solution = %d | mean #sols = %.2f"%(worst,nofind,np.mean(counts)))
```

The variable names are terse where the chapter versions are spelled out, so that the whole solver sits on one screen next to the algebra of Chapter 11. The DH constants are identical to the table in Chapter 10.2.
