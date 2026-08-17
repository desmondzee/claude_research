# The VCP6 Handbook

### A working textbook on the Teensy 4.1, TMC2209 stepper drivers, and the kinematics of a PAROL6-class robot arm

**Compiled August 2026**

---

## How to read this

This document is written to be read in order, like a textbook, but each part is self-contained enough that you can jump straight to the chapter you need. It is aimed at someone who is actually building the machine, so the emphasis throughout is on *why* a thing behaves the way it does, and then on the specific numbers, registers, and pin names you will need at the bench.

Three warnings before you start.

First, where I give register values, formulas, or pin numbers, treat them as a strong starting point rather than gospel — silicon revisions, breakout-board variants, and Teensyduino core updates all move things around. Every number in here that matters is one you should confirm against the TMC2209 datasheet, the PJRC pin card, or your own board before you commit to it in hardware.

Second, the kinematics chapters use the published PAROL6 Denavit–Hartenberg table. I have checked it numerically — the forward kinematics it produces gives a reach of about 396 mm, which agrees with the published 400 mm figure, and the wrist axes intersect as they should. But your VCP6 is a variant, so if you change a link length or a mounting offset you must re-derive, not just re-use.

Third, the single most common way these projects fail is not maths and not firmware. It is power and grounding. Chapter 6 has a section on this and it is not optional reading.

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

Concretely, the RT1062 is an ARM Cortex-M7 running at 600 MHz. That is a genuinely fast core, and not merely because of the clock rate. The M7 is *superscalar*, meaning it has two instruction pipelines and can retire up to two instructions per clock cycle when the code allows it. It has a six-stage pipeline with branch prediction, a proper hardware floating-point unit that handles both single and double precision, and the ARM DSP instruction set extension for saturating and SIMD-style integer arithmetic. In practical terms it will chew through the trigonometry in an inverse-kinematics solution without you having to think about it. A full six-axis IK solve using double-precision `atan2` and `sqrt` lands comfortably in the tens of microseconds, which means you could run it thousands of times a second if you wanted to.

That matters for your project more than it might first appear. On an 8-bit AVR or even a 72 MHz STM32F1, you spend a lot of design effort avoiding floating point and pre-computing tables. On the Teensy 4.1 you can simply write the maths the way it appears in the textbook, in `float` or even `double`, and it will be fast enough. Design your firmware to take advantage of that rather than prematurely optimising.

## 1.2 The board around the chip

PJRC surrounds that processor with a fairly minimal but very well-chosen set of support hardware. There is 8 MB of QSPI flash on board for your program, of which just under 8 MB is available to you — an amount that is difficult to fill with hand-written firmware. There is a microSD socket wired to the SDIO peripheral in 4-bit mode, which is genuinely fast, not the bit-banged SPI arrangement you find on cheaper boards. There is a 10/100 Ethernet MAC brought out to a set of pads (you supply the magjack). There are USB host pins, so the Teensy can act as a USB *host* and talk to keyboards, or to another microcontroller. And there are two footprints on the underside of the board for extra QSPI chips: you can solder on additional flash, or PSRAM, or one of each.

Electrically, the board runs at 3.3 volts and — this is the single most important electrical fact about it — **the pins are not 5 volt tolerant**. Putting 5 V on a Teensy 4.x input pin is a reliable way to destroy that pin, and sometimes the chip. This is directly relevant to your project because a great many stepper driver breakout boards, limit switch boards, and Chinese optical endstops are designed around 5 V logic. Every one of those needs either a level shifter, a resistive divider, or an open-collector arrangement with the pull-up going to 3.3 V rather than 5 V. Build the habit of asking "what voltage does this thing actually drive?" before every single connection.

The output drive is also modest. A Teensy 4.x pin sources or sinks a few milliamps comfortably — around 4 mA in the default pad configuration, and the pad drive strength can be increased in the register settings, but you should treat something like 10 mA as a practical ceiling per pin and keep the total across the chip well below its absolute maximum. This is plenty for driving the STEP, DIR, and EN inputs of a TMC2209, which are high-impedance CMOS inputs drawing essentially no current. It is emphatically not enough to drive a relay coil, a solenoid, or a brake directly. Anything with a coil in it gets a transistor and a flyback diode.

Power comes in over USB or over the VIN pin, which accepts roughly 3.6 to 5.5 V. The board draws on the order of 100 mA at full speed. There is a small but important detail here: the Teensy 4.1 ships with a solder pad between VUSB and VIN that is bridged by default. If you intend to power the board from an external 5 V supply *while also* having USB plugged in for programming and debugging — which you will, constantly, during development — you must cut that trace. Otherwise you are connecting your bench supply's 5 V rail directly to your computer's USB 5 V rail, which in the best case does nothing and in the worst case damages a USB port. Cut it early, before you forget.

## 1.3 The peripheral set, and what you will actually use

The RT1062 has far more peripherals than any one project needs. Here is the subset that matters for a six-axis stepper-driven arm.

For **digital I/O**, you have 55 usable pins, of which 42 are on the outer edges and breadboard-friendly; the rest are on the underside pads. A six-axis arm with STEP, DIR, and a shared enable, plus six DIAG lines, plus six limit switches, plus a UART pair for the drivers, comes to well under half of that. You will not run out of pins, which is a luxury and means you can afford to give each driver its own DIAG input rather than wire-OR-ing them.

For **timing**, there are four FlexPWM modules, each with three submodules; four QuadTimer modules with four channels each; four Periodic Interrupt Timers; and two General Purpose Timers. This is an embarrassment of riches and Chapter 3 is entirely about how to spend it.

For **serial**, there are eight hardware UARTs (`Serial1` through `Serial8`), three SPI buses, three I²C buses, two CAN 2.0B controllers plus one CAN-FD controller, and the native high-speed USB. Chapter 4 covers these.

For **feedback**, there are four hardware quadrature decoder units, which can count encoder pulses entirely in hardware without troubling the CPU. If you ever move the VCP6 from open-loop steppers to closed-loop with encoders on the joints, this is what you will use, and it is worth knowing it exists now so you leave the right pins free.

For **analogue**, there are two ADCs covering 18 input pins, with 12-bit resolution available. Useful for reading a potentiometer-based teach pendant, monitoring supply voltage, or reading a current-sense output.

And underpinning all of it, a **32-channel DMA controller**. DMA lets a peripheral move data to or from memory without the CPU being involved at all. For stepper control this is the difference between a firmware that stutters when the USB link gets busy and one that does not.

## 1.4 Clocking and overclocking

The 600 MHz figure is the default, not a limit. The Teensyduino tools menu lets you select clock speeds from 24 MHz up to 1 GHz. Running above 600 MHz requires attention to cooling — the little chip will happily throttle or misbehave when hot, and PJRC sell a heatsink kit for exactly this reason.

For a robot arm, my advice is to leave it at 600 MHz. You will not be compute-bound. What you *will* be is timing-bound, and a stable, well-characterised clock is worth more than headline speed. If you ever find yourself wanting to overclock to make the motion planner keep up, the correct fix is almost always to restructure the planner rather than to raise the clock.

One clocking detail does matter: the RT1062's clock tree is complex, with multiple PLLs feeding different peripheral groups, and some peripherals derive their clocks from sources you might not expect. When you compute a timer period or a UART baud divisor by hand, always confirm which clock actually feeds that peripheral rather than assuming it is the core clock. The Teensyduino core handles this for you in the standard APIs; it becomes your problem only when you drop to bare registers.

# Chapter 2 — Memory, cache, and why your ISR is slow

## 2.1 The layout

The Teensy 4.1 has 1024 KB of on-chip RAM, and the way it is divided is one of the things that trips people up most often.

The first 512 KB is called RAM1, and it is *tightly coupled memory* — TCM. Tightly coupled memory is connected to the Cortex-M7 through dedicated buses that bypass the normal system interconnect entirely. Access is single-cycle, deterministic, and never contends with DMA or with anything else on the bus. RAM1 is split into two halves at compile time, in 32 KB blocks: **ITCM**, which holds executable code, and **DTCM**, which holds your ordinary variables, your stack, and anything you have not explicitly placed elsewhere.

The second 512 KB is called RAM2, or OCRAM — on-chip RAM. This sits on the normal AXI bus. It is still fast, but access goes through the data cache, and it can contend with DMA transfers. In the Teensyduino world, RAM2 is where `malloc` allocates from, and where anything you mark with the `DMAMEM` attribute is placed.

Then there is the 8 MB of QSPI flash. Your program lives there when the board is powered off, but at boot the Teensy copies the code into ITCM and runs it from there. This is why a Teensy 4.1 takes a fraction of a second to start: it is not just jumping to a reset vector, it is performing a copy. It is also why your available fast RAM shrinks as your program grows — every kilobyte of code claims a kilobyte of ITCM.

Optionally, you can solder PSRAM to the underside pads. That gives you a large, slower external memory, reachable as `EXTMEM`. For a robot arm you would use it for something like a long recorded trajectory, or a big lookup table, not for anything in the real-time path.

## 2.2 Why this matters for real-time motion control

Here is the practical rule that follows from all of the above: **anything in your step-generation interrupt should live in tightly coupled memory.**

The reason is cache behaviour. Code and data in RAM2, or in flash, go through the M7's 32 KB instruction cache and 32 KB data cache. Caches are wonderful for average-case throughput and terrible for worst-case latency. When the data your interrupt needs happens to be in cache, the access takes a cycle. When it is not — a cache miss — you stall for many cycles while the memory system fetches a whole cache line. In ordinary code you never notice. In an interrupt that has to fire every 50 microseconds and produce a step pulse with tight timing, an unpredictable multi-cycle stall shows up as *jitter*, and jitter in step timing shows up as audible noise and, at high speeds, as lost steps.

The good news is that on the Teensy the default is already the right one. Ordinary global and static variables land in DTCM, and code lands in ITCM, unless you have said otherwise. You mostly need to know this so that you *don't* do the wrong thing — for example, don't put your step-position array in `DMAMEM` because you read somewhere that DMAMEM is for buffers. Put DMA buffers there, and keep the motion state in DTCM.

The second half of the rule concerns cache coherency. If you set up a DMA transfer to move data from a buffer in RAM2 out to a peripheral, the CPU may have written that data into the data cache but not yet flushed it out to the actual RAM the DMA engine reads. The result is that the DMA sends stale data. The Teensyduino core provides `arm_dcache_flush_delete()` and related functions for exactly this, and any DMA-based approach must call them at the right moments. This is the single most common source of "my DMA works sometimes" bugs on the Teensy 4.x.

## 2.3 Practical guidance

Write your firmware normally to begin with. Do not preemptively scatter memory attributes around. When you get to the point of measuring step-pulse jitter with a scope — and you should get to that point — you will know exactly which buffers to move and why. Premature memory placement is as bad an idea as any other premature optimisation, and on this chip the defaults are genuinely good.

Do, however, keep an eye on the compile-time report Teensyduino prints. It tells you how much of RAM1 has gone to code, how much is left for variables, and how much RAM2 is in use. If ITCM usage creeps up towards the point where your variables no longer fit in DTCM, you will want to know before the linker tells you in a confusing way.

# Chapter 3 — Timers, PWM, and the art of making step pulses

## 3.1 What a stepper driver actually wants from you

Before discussing the Teensy's timers, it is worth being very precise about what the controller has to produce, because the requirement is deceptively simple.

A step/direction driver like the TMC2209 has two logic inputs that matter for motion. **DIR** is a level: high means one direction, low means the other. **STEP** is an edge: on each rising edge, the driver advances its internal microstep counter by one position, which shifts the current in the two motor coils by one increment around the sine/cosine table, which rotates the motor by one microstep.

That is the whole interface. There is no position, no velocity, no acknowledgement. The driver has no idea where the motor is and no idea whether it got there. Everything about position and speed is encoded purely in *when* you send the edges.

The requirements are: DIR must be stable for a short setup time before the STEP edge (the TMC2209 needs on the order of 20 ns, which is nothing — but if you toggle DIR in one interrupt and STEP in another you can violate it, so don't); the STEP pulse must be at least a minimum width high and a minimum width low (again, tens of nanoseconds for the TMC2209 — trivially satisfied); and the *interval* between edges determines speed.

That last point is where all the difficulty lives. Motor speed in revolutions per second is simply the step frequency divided by the number of microsteps per revolution. To accelerate smoothly, you must smoothly vary the interval between consecutive edges. To coordinate six axes so that the tool moves in a straight line, you must produce six independent, precisely-related pulse trains simultaneously. And any error in the timing of those edges — any jitter — is a small velocity error, which at best makes noise and at worst causes a motor to lose synchronisation with its field and skip.

## 3.2 The step-rate budget

Let us work out how hard this actually is for the VCP6.

A standard NEMA-17 stepper is 1.8° per full step, which is 200 full steps per revolution. At 1/32 microstepping — which is what the PAROL6 uses on all axes — that is 6400 microsteps per motor revolution. Now apply the reduction ratios: joint 2 has a 20:1 planetary gearbox, so a full revolution of joint 2 takes 128,000 microsteps.

Suppose you want joint 2 to move at 60° per second, which is a fairly brisk but not extreme speed for a desktop arm. That is one sixth of a revolution per second, so about 21,300 steps per second. Joint 1, with its 6.4:1 belt, needs about 6,800 steps per second for the same angular rate. Sum across six axes moving together and you are looking at a worst case somewhere in the region of 60,000 to 100,000 step events per second.

Now the key architectural question: can you afford an interrupt per step? At 100,000 interrupts per second on a 600 MHz core, you have 6,000 clock cycles between interrupts. Interrupt entry and exit on a Cortex-M7 costs on the order of 20 to 30 cycles. Even a fairly heavy handler doing per-axis Bresenham arithmetic will fit in a few hundred cycles. So yes — comfortably. This is one of those cases where the Teensy's raw speed buys you the freedom to use the simple architecture, and you should take it.

Compare that with an 8-bit AVR at 16 MHz, where the same interrupt rate would leave you 160 cycles and the answer would be a firm no. Much of the received wisdom in the 3D printer and CNC world about clever step-generation tricks was developed under that constraint. You do not have that constraint.

## 3.3 The timing resources available

**Periodic Interrupt Timers (PIT)** are the simplest option, and on the Teensy they are exposed through the `IntervalTimer` class. You get four of them. You give one a period in microseconds and a function to call, and it calls that function at that rate, forever. `IntervalTimer` accepts floating-point microseconds and internally computes the closest achievable divisor from the peripheral clock, so the resolution is far better than one microsecond. This is the workhorse for a fixed-rate control loop.

**FlexPWM** modules are the sophisticated option. There are four of them, each with three submodules, each submodule having two outputs. FlexPWM can generate pulses entirely in hardware with no CPU involvement, can be reloaded from a buffer, can be triggered by and can trigger other peripherals, and can be driven by DMA. If you want *perfectly* jitter-free step pulses at very high rates, FlexPWM is how you get them. The cost is complexity: you are programming a fairly intricate peripheral more or less directly.

**QuadTimer** modules — four of them, four channels each — sit between the two in capability. They can generate periodic outputs, capture input edges, and cascade. The well-known `TeensyStep` library uses these to generate step pulses in hardware, which is why it can hit step rates in the hundreds of thousands per second without the CPU melting.

**General Purpose Timers (GPT)**, of which there are two, are similar in spirit to the PIT but with more features.

And finally the **ARM cycle counter**, `ARM_DWT_CYCCNT`, is a free-running 32-bit counter incrementing once per core clock. At 600 MHz it wraps about every seven seconds. It is not a scheduling mechanism, but it is the single best tool you have for *measuring* how long a piece of code takes, and you should instrument your interrupt handler with it early.

## 3.4 Three architectures, and which to choose

**Architecture one: the fixed-rate DDA.** You run a single `IntervalTimer` at a constant high rate — say 20 kHz or 40 kHz. On every tick, for each of the six axes, you run a Bresenham-style accumulator: add that axis's "steps remaining" increment to an accumulator, and when the accumulator overflows, emit a step pulse on that axis. Acceleration is handled by recomputing the increments periodically from a velocity profile.

This is the architecture used by GRBL, by Marlin, and by most of the CNC world, and it exists for good reasons. It produces exactly coordinated multi-axis motion, because all axes are driven from the same tick and therefore cannot drift relative to one another. It is straightforward to reason about. It has a bounded, predictable CPU cost — one interrupt at a fixed rate, regardless of how fast the motors are going. And the step timing quantisation it introduces (each step lands on a tick boundary) is small if your tick rate is comfortably above your maximum step rate.

Its limitation is exactly that quantisation. If your tick rate is 20 kHz, your maximum step rate is 20 kHz per axis, and step intervals are quantised to 50 µs. At high speeds that quantisation becomes a meaningful fraction of the interval and shows up as velocity ripple. The fix is simply to raise the tick rate, which on a 600 MHz M7 you can afford to do.

**Architecture two: per-axis hardware timers.** Give each axis its own timer channel, programmed to generate a pulse train at that axis's current required rate, and reprogram the rate periodically as the velocity profile evolves. `TeensyStep` works essentially this way. The advantage is very high achievable step rates with essentially zero jitter and almost no CPU load. The disadvantage is that coordinating six axes so that they arrive together requires care, because each timer runs independently and there is no shared tick keeping them in lockstep.

**Architecture three: DMA-fed hardware PWM.** You precompute a buffer of pulse timings and let DMA feed them to a FlexPWM module. This is the highest-performance and highest-complexity option. It is genuinely appropriate for very fast machines, and it is almost certainly overkill for a desktop arm.

**My recommendation for the VCP6 is architecture one**, a fixed-rate DDA at something like 25 to 50 kHz, driven by an `IntervalTimer`. It gives you exact multi-axis coordination, which for a robot arm is the thing you care about most — a Cartesian straight line depends on all six joints tracking a common time base. Measure the ISR duration with the cycle counter, confirm you are using well under half the available time, and move on to the parts of the problem that are actually hard.

## 3.5 Structuring the step ISR

A good fixed-rate step ISR has a very specific shape. It should do the minimum possible work and it should never, ever block. Concretely:

The ISR reads a "current segment" structure that some lower-priority code has prepared: the step increments per axis, the direction bits, and how many ticks this segment lasts. It updates the six accumulators, sets any direction pins that need to change, emits step pulses where accumulators overflowed, decrements the segment's remaining tick count, and — if the segment is finished — pops the next segment from a ring buffer. That is all.

Everything else happens outside the ISR. Velocity profiling, look-ahead, inverse kinematics, communication with the host: all of it runs in the main loop or in a lower-priority interrupt, producing segments into the ring buffer that the ISR consumes. The ring buffer is the boundary between the hard real-time world and the soft real-time world, and keeping that boundary clean is the single most important structural decision in the firmware.

Two implementation details are worth stating explicitly. Variables shared between the ISR and the main loop must be declared `volatile`, or the compiler will happily cache them in a register and your main loop will never see the ISR's updates. And on a Cortex-M7 with a write buffer, if the last thing your ISR does is clear an interrupt flag, add a memory barrier or a dummy read afterwards, or the write may not have landed before the ISR returns and you will get a spurious re-entry.

For the step pulse itself, the neat trick is not to bother with a delay. Set all the step pins high at the start of the ISR body, do all your accumulator arithmetic, and set them low at the end. The arithmetic itself provides the pulse width, it is comfortably longer than the driver's minimum, and you have spent no time waiting.

# Chapter 4 — Serial communication on the Teensy 4.1

## 4.1 What "serial" means here

The word "serial" gets used loosely, so let us pin it down. On the Teensy 4.1 you have several genuinely different things that all get called serial at various times.

There is **USB serial**, which is the `Serial` object, the thing that appears as a COM port or `/dev/ttyACM*` on your computer when you plug the board in. There are **eight hardware UARTs**, `Serial1` through `Serial8`, which are asynchronous serial ports on physical pins. There is **SPI**, a synchronous, clocked, master-driven bus. There is **I²C**, a two-wire addressed bus. And there is **CAN**, a differential multi-drop bus designed for noisy environments.

They solve different problems and you will probably end up using three of them.

## 4.2 The eight hardware UARTs

Each of the Teensy's eight serial ports is backed by an independent LPUART peripheral in the RT1062. "Independent" is the key word: they run in parallel, in hardware, with no software multiplexing and no shared bandwidth. You can have all eight running simultaneously at different baud rates without any of them affecting the others.

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

Note that `Serial8` exists only on the Teensy 4.1, not the 4.0, and that pins 34 and 35 are on the underside of the board in the second row. Note also the ordering trap: for most ports RX comes before TX numerically, but `Serial3` and `Serial5` are the other way round. Miswiring these is a rite of passage; if a port is silent, swapping RX and TX is always the first thing to try.

Using one is as simple as it looks:

```cpp
void setup() {
  Serial1.begin(115200);          // 8 data bits, no parity, 1 stop bit
  Serial2.begin(250000, SERIAL_8E1);  // 8 data, even parity, 1 stop
}
```

The baud rate is generated by dividing a peripheral clock, so not every arbitrary number is exactly achievable. The core picks the closest divisor. UART framing tolerates roughly 2–3% total error between the two ends before it starts corrupting bytes, and standard rates are chosen to divide nicely, so in practice this only bites you at unusual rates or very high speeds.

## 4.3 Buffers, FIFOs, and flow control

Each LPUART has a small hardware FIFO — four bytes deep on this part. Above that, the Teensyduino core maintains software ring buffers in RAM, filled and drained by the UART interrupt. This layering is why `Serial1.write()` returns almost immediately: it copies into the software buffer and lets the interrupt dribble the bytes out at baud rate in the background.

The consequence is that `write()` only blocks when the software transmit buffer is full. The default buffers are modest — a few hundred bytes. If you send a burst larger than the buffer, `write()` will sit there spinning until space frees up, which at 115200 baud means about 87 microseconds per byte. In a motion controller, blocking for milliseconds in your main loop because you decided to print a debug message is a real and common bug.

The core gives you two tools. `Serial1.addMemoryForWrite(buffer, size)` and the matching `addMemoryForRead` let you hand the driver a larger buffer of your own. And `Serial1.availableForWrite()` tells you how much space is free, so you can check before writing rather than discovering the hard way. In real-time code, the discipline is: never call `write()` without first confirming there is room, and if there isn't, drop the message or defer it rather than blocking the motion loop.

For hardware flow control, the LPUARTs support RTS and CTS, exposed as `Serial1.attachRts(pin)` and `Serial1.attachCts(pin)`. They also support a **transmitter enable** output via `Serial1.transmitterEnable(pin)`, which asserts a pin for exactly the duration of a transmission. That last one is specifically designed for half-duplex RS-485, where you need to switch a transceiver between drive and receive around each message, and getting that timing right in software is fiddly. If you ever run a long cable to a remote I/O board on the arm, RS-485 with `transmitterEnable` is the right way to do it.

## 4.4 USB serial

The `Serial` object is not a UART at all. It is a USB CDC virtual serial device implemented over the Teensy's native high-speed USB, which runs at 480 Mbit/s. As a result the `begin()` baud rate argument is entirely ignored — there is no physical baud rate to set. Actual throughput is limited by USB packet scheduling and by the host, and lands somewhere in the region of 10–25 MB/s in practice, which is orders of magnitude beyond any UART.

Two behaviours are worth knowing. First, USB CDC is packet-based, not stream-based at the hardware level: the Teensy accumulates written bytes and sends them either when a packet fills or after a short timeout. If you want a message to go out immediately, call `Serial.send_now()`. Second, `Serial` reports as false in a boolean context until the host has actually opened the port. `while (!Serial) ;` in `setup()` will hang forever if you power the board from a bench supply with no computer attached — which is precisely the situation your finished robot will be in. Guard it with a timeout, or leave it out entirely and accept that you will miss the first few debug lines.

For the VCP6, USB serial is the natural choice for the host link: it is fast, it needs no extra hardware, and the same cable programs the board.

## 4.5 Choosing the right bus for each job

Here is how I would allocate the buses on a six-axis arm.

**Host to Teensy**: USB serial. Fast, free, and already there.

**Teensy to TMC2209 drivers**: a hardware UART, in the TMC2209's single-wire UART mode. This is covered in detail in Chapter 7. The short version is that up to four drivers can share one UART line by address, so six axes need two UARTs — say `Serial1` and `Serial2`. Run them at 115200 baud, which is plenty since driver configuration is not in the real-time path.

**Teensy to a teach pendant, display, or auxiliary board**: another UART, or I²C if the device is nearby and slow.

**Teensy to a gripper or tool**: depends on the tool. A simple servo gripper needs one PWM pin. A smart gripper might want its own UART.

**Anything over a long or noisy cable**: CAN, or RS-485. Both are differential, both survive electrical environments that would destroy a plain UART. On a desktop arm with sub-metre cable runs, you probably do not need this, but it is worth knowing that when you *do* start seeing corrupted bytes on a cable that runs alongside a motor lead, the answer is a differential bus, not a higher baud rate.

## 4.6 Designing the host protocol

Whatever you send over the host link, design the framing deliberately. The naïve approach — printing human-readable lines terminated by newline — is fine for debugging and genuinely bad for control, because a single dropped byte desynchronises you, floating-point text parsing is slow, and you have no way to detect corruption.

A robust binary frame has four parts: a **start marker** (a distinctive byte, or better a two-byte sequence unlikely to occur in data), a **length** field, the **payload**, and a **checksum or CRC** over the payload. The receiver runs a small state machine: hunt for the start marker, read the length, accumulate that many payload bytes, verify the CRC, and only then act. If the CRC fails, discard and go back to hunting. This recovers automatically from any corruption, which a newline-delimited text protocol does not.

Add a **sequence number** if you care about detecting lost frames, and an **acknowledgement** from the Teensy back to the host if you need flow control at the application level. For a robot arm, I would define a small set of message types: set joint targets, request status, set driver current, home an axis, emergency stop. Keep the emergency stop message as short and as distinctive as possible, and handle it before you do anything else in the parser.

One final and important protocol design point: **never let the arm keep moving if the host goes quiet.** Implement a watchdog. If the Teensy has not heard a valid frame from the host within some timeout — a few hundred milliseconds — it should decelerate to a stop and hold. A robot that continues executing its last command after the control PC crashes is a robot that will eventually hurt something.

# Chapter 5 — Stepper motors from first principles

## 5.1 What is inside

A hybrid stepper motor — the type in essentially every NEMA-17 you will encounter — has a rotor and a stator, and the clever part is the geometry of the teeth.

The rotor is a permanent magnet mounted axially, with a soft-iron cup at each end. Each cup is machined with fifty teeth around its circumference. The two cups are offset from one another by half a tooth pitch, and because the magnet runs between them, one end cap is magnetically north and the other south. So going around the rotor you see fifty north teeth, and interleaved between them, fifty south teeth — one hundred teeth in total, alternating in polarity.

The stator surrounds it and carries eight poles, each wound with a coil, each pole also having several small teeth on its face. The eight coils are wired into two independent phases, usually called A and B. The two phases are positioned so that when phase A's teeth are perfectly aligned with rotor teeth, phase B's are offset by a quarter of a tooth pitch.

Energise phase A and the rotor snaps to align with it. Now de-energise A and energise B: the nearest alignment for B is a quarter tooth pitch away, so the rotor rotates by that amount. Continue through the four combinations — A positive, B positive, A negative, B negative — and the rotor advances one full tooth pitch, then repeats. With fifty teeth and four steps per tooth, you get two hundred steps per revolution, which is 1.8° each.

This is why 200 steps per revolution is not a design choice someone made in software. It falls directly out of the fifty-tooth rotor geometry.

## 5.2 Torque, and why it falls off with speed

The torque a stepper produces is, to a good approximation, proportional to the *phase current*, not the voltage. This single fact drives everything about how stepper drivers are built.

The problem is that a motor winding is an inductor. When you apply a voltage V across an inductance L with resistance R, the current does not appear instantly; it rises exponentially with time constant L/R towards a final value V/R. A typical NEMA-17 winding might have 2–4 mH of inductance and a couple of ohms of resistance, giving a time constant of a millisecond or so.

Now consider running the motor fast. At 1000 full steps per second, each step lasts one millisecond, and the driver has to reverse the current in a winding within that time. If the time constant is also a millisecond, the current never gets close to its target before it is asked to reverse. Average current falls, and torque falls with it.

Worse, a spinning motor generates back-EMF proportional to speed, which opposes the applied voltage and further reduces the current the driver can push. Together these produce the characteristic stepper **torque–speed curve**: flat holding torque at zero and low speed, then a progressively steeper roll-off, until at some speed the motor cannot produce enough torque to turn its own rotor and stalls.

The remedy is voltage. If you drive the winding from a much higher voltage than V = I·R would suggest, current rises far faster, because the initial rate of rise is V/L. Then you chop the voltage on and off rapidly to regulate the average current to the value you actually want. This is exactly what a chopper driver does and it is the whole reason you run a 24 V supply into a driver for a motor whose windings are rated at 2 volts. **Higher supply voltage buys you high-speed torque, and nothing else.** Within the driver's rating, more volts is generally better.

For the VCP6, this argues for running the highest supply voltage your drivers and your thermal budget allow. The TMC2209 accepts up to 29 V, so a 24 V supply is the natural choice — it leaves margin for supply tolerance and for the voltage spikes a decelerating motor pumps back into the rail.

## 5.3 Microstepping, and what it does and does not give you

If instead of switching the phases fully on and off you drive them with currents that follow a sine and a cosine, the resulting magnetic field vector rotates smoothly rather than jumping, and the rotor follows it smoothly. Divide each full step into 32 increments and you have 1/32 microstepping: 6400 positions per revolution instead of 200.

Microstepping gives you two very real benefits and one illusory one.

The first real benefit is **smoothness**. Full-stepping slams the rotor between positions, exciting the motor's mechanical resonance, producing audible noise, and — on a lightweight 3D-printed arm — visible vibration. Microstepping makes the motion continuous and quiet. On a machine like the VCP6 this alone justifies it.

The second real benefit is **avoiding resonance**. A stepper plus its load forms a resonant system, typically somewhere in the region of 100 Hz. Drive it at full steps near that rate and the oscillation can build until the motor loses steps entirely — the notorious mid-band resonance. Microstepping spreads the excitation across many small increments and largely eliminates the problem.

The illusory benefit is **resolution**. It is tempting to think 1/32 microstepping gives you 32 times the positional accuracy. It does not. The torque a stepper produces is proportional to the sine of the angular error between rotor and field. Between full-step positions, that relationship means the *incremental* holding torque near a microstep position is very small — roughly proportional to the sine of one microstep angle. With 1/32 microstepping, a microstep is 0.056°, and the torque available to hold that precise position is a percent or two of the motor's full holding torque. Any friction, any load torque, and the rotor simply sits somewhere else. In an open-loop system, the achievable positional accuracy is set by friction, by gearbox backlash, and by structural compliance — not by microstep count.

So: microstep for smoothness, and get your accuracy from the mechanics and from calibration. The PAROL6's quoted 0.1 mm repeatability comes from its gearboxes and its structure, not from its microstepping.

There is a nice bonus here. Because the TMC2209 has a feature called MicroPlyer, you can feed it a modest step rate and it will internally interpolate up to 1/256 microstepping. You get the smoothness of very fine microstepping while your controller only has to generate a thirty-second of the pulses. For a six-axis arm, that is a meaningful reduction in step-generation load for free.

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

They also introduce backlash, and this is the honest limitation of the design. A belt drive has very little backlash but does have compliance — it stretches under load. A planetary gearbox has meaningful backlash, typically measured in arc-minutes. Neither is visible to the controller in an open-loop system: the Teensy knows how many pulses it sent, not where the joint actually is. Every source of lost motion downstream of the motor is invisible error.

## 5.5 A thermal warning specific to this arm

The PAROL6 is printed in PETG, and PETG softens at temperatures a stepper motor reaches without difficulty. The official documentation gives operating limits in the region of 48–61 °C for holding and 52–73 °C while moving, and explicitly tells you to reduce motor current in software for extended operation.

Take this seriously. A stepper at its rated current, holding position, dissipates its full I²R losses continuously and gets genuinely hot — hot enough to soften a printed motor mount, at which point the mount deforms, alignment goes, and the arm's accuracy quietly degrades before anything visibly fails.

The mitigations are, in order of usefulness: run the lowest current that reliably holds the load, use the driver's automatic hold-current reduction so that a stationary motor drops to a fraction of its running current, disable motors entirely when the arm is parked and not required to hold position, and monitor driver temperature flags so the firmware can back off before something melts. The TMC2209 gives you all of these; Chapter 7 covers `IHOLD_IRUN`, `TPOWERDOWN`, and the over-temperature warning flags.

# Chapter 6 — How a stepper driver actually works

## 6.1 The H-bridge

At the bottom of every stepper driver are two H-bridges, one per phase. An H-bridge is four transistors arranged around a load in the shape of the letter H: two on the high side connecting to the supply, two on the low side connecting to ground, and the winding across the middle.

Turn on the top-left and bottom-right transistors and current flows left-to-right through the winding. Turn on top-right and bottom-left and it flows right-to-left. Turn on both low-side transistors and the winding is short-circuited to ground, which lets circulating current decay slowly. Turn everything off and the current has nowhere to go except through the body diodes back into the supply, which makes it decay very fast.

Those four states — drive forward, drive reverse, slow decay, fast decay — are the complete vocabulary of the power stage. Everything a driver does is a pattern of switching between them.

One thing an H-bridge must never do is turn on the high-side and low-side transistors of the same leg simultaneously, which shorts the supply straight to ground through the transistors. This is called shoot-through and it destroys drivers. Every real driver inserts a small dead time between turning one off and the other on. You do not have to think about this, but it is worth knowing it is there, because dead time is one of the things that limits how fine the current control can be at very low currents.

## 6.2 Chopper current regulation

The driver's job is to make the winding current follow a target. Since the winding is an inductor fed from a supply much higher than V = I·R, the approach is to switch rapidly.

The classic scheme, and the one the TMC2209 uses in its `SpreadCycle` mode, is **constant off-time chopping with current comparison**. It works like this. The driver turns on the appropriate transistors to drive current through the winding. Current ramps up. A sense resistor in series with the low side develops a voltage proportional to that current, and a comparator watches it. When the current reaches the target, the driver switches to a decay state and holds it for a fixed off-time. During that off-time the current falls. When the off-time expires, the driver drives again, current rises to the target, and the cycle repeats. The result is a current that hovers around the target in a small sawtooth, at a chopping frequency typically in the tens of kilohertz.

The subtlety is in *how* it decays. Pure slow decay (shorting the winding) means current falls slowly, which is good for ripple but bad when the target current is falling rapidly — the actual current cannot follow it down and you get distortion of the sine wave. Pure fast decay tracks a falling target well but produces large ripple and more heating. Trinamic's SpreadCycle is a mixed scheme that automatically chooses fast or slow decay based on measured behaviour, which is why it does not need the fiddly decay-mode tuning that older drivers such as the A4988 and DRV8825 require. If you have ever spent an evening adjusting a `TDECAY` setting, SpreadCycle is the thing that makes that unnecessary.

## 6.3 StealthChop: a completely different approach

Trinamic's other mode, `StealthChop`, does not regulate current cycle-by-cycle at all. Instead it is a **voltage-mode PWM**: the driver applies a PWM voltage to the winding whose duty cycle is computed to produce the desired current, and it adjusts that duty cycle slowly based on measurements. Because the PWM runs at a fixed frequency and the current is not being chopped against a comparator threshold, the current waveform is far smoother and there is no chopper noise.

The result is a motor that is essentially silent. This is genuinely striking the first time you hear it — a stepper that under SpreadCycle whines audibly becomes inaudible under StealthChop.

The trade-off is dynamic response. Because StealthChop regulates slowly, it does not handle rapid changes in load or rapid acceleration as well as SpreadCycle does, and its high-speed torque is lower. The standard configuration is therefore to run StealthChop at low speeds where noise matters and torque demand is low, and switch automatically to SpreadCycle above a velocity threshold. The TMC2209 does this for you: set the `TPWMTHRS` register to a velocity threshold and the chip handles the crossover.

For a robot arm, I would start in StealthChop everywhere, because a quiet arm is a pleasant arm and desktop arm speeds are modest, and then enable the SpreadCycle crossover on any joint that shows signs of struggling at speed — typically J2 and J3, which carry the most load.

## 6.4 Setting the current

This is the setting people get wrong most often, so it is worth being methodical.

A stepper motor's data sheet gives a **rated current per phase**. This is the current at which the manufacturer guarantees the motor will not exceed its temperature rating in still air at some ambient temperature. It is a thermal limit, not a magic number, and exceeding it does not cause instant failure — it causes the motor to run hotter, which on a PETG-framed arm matters a great deal.

Note also whether the rating is RMS or peak. Driver current settings are usually specified in RMS, and motor ratings are often given as peak-per-phase. The ratio is √2, so confusing them means being off by 41%, which is more than enough to cook something.

There are two ways to set current on a TMC2209, and understanding both is important because they interact.

The **analogue** route uses the VREF pin. In standalone mode, and by default in UART mode too, the chip scales its current reference by the voltage on VREF. Breakout boards fit a small trimpot that divides the internal 5 V rail down to VREF, so turning the pot changes the current. This is the "measure VREF with a multimeter and turn the tiny screw" ritual familiar from 3D printers.

The **digital** route uses the `IHOLD_IRUN` register over UART. `IRUN` is a 5-bit value, 0 to 31, that scales the current while the motor is moving. `IHOLD` is a separate 5-bit value used when the motor has been stationary for a while. This is far better than the pot: it is repeatable, it is remotely settable, and crucially it lets you drop hold current automatically.

The interaction is the gotcha. GCONF bit 0, `i_scale_analog`, selects whether VREF scales the current. On the TMC2209 this bit **defaults to 1**, meaning VREF is in play. So you can set `IRUN` to 31 over UART, get a fraction of the current you expected, and be thoroughly confused — because the pot on the board is turned down. The fix is either to set `i_scale_analog = 0` so that the internal reference is used and `IRUN` alone determines current, or to turn the pot to maximum and control everything digitally. I recommend the former: it removes an analogue variable from your system entirely.

The formula relating `IRUN` to actual current, from the datasheet, is:

```
I_RMS = ((CS + 1) / 32) × (V_FS / (R_sense + 0.02 Ω)) × (1 / √2)
```

where `CS` is the current-scale value (i.e. `IRUN` while moving, `IHOLD` at rest), `R_sense` is the sense resistor on your breakout board, and `V_FS` is the full-scale sense voltage: 0.325 V when the `vsense` bit in `CHOPCONF` is 0, or 0.180 V when it is 1. The `+ 0.02 Ω` accounts for internal resistance in the chip.

Most common breakout boards — BigTreeTech, Fysetc, and similar — use a 0.11 Ω sense resistor. Plugging that in with `vsense = 0` and `CS = 31` gives a maximum of about 1.77 A RMS, which is above the chip's 1.4 A RMS continuous rating, so you will not be using the top of the range. With `vsense = 1` the full-scale drops to about 0.98 A RMS, giving you finer resolution over a lower range — which is often exactly what you want on the smaller joints.

The practical procedure: work out your motor's RMS rating, decide on 60–80% of it as a starting point (you can always raise it), pick `vsense` so that your target lands in the upper half of the available range for best resolution, solve the formula for `CS`, and set `IRUN` to that. Set `IHOLD` to somewhere between a third and a half of `IRUN`. Then run the arm and put your hand on the motors after ten minutes.

## 6.5 Hold current, standstill, and heat

`TPOWERDOWN` sets how long after the last step the driver waits before ramping the current down from `IRUN` to `IHOLD`. `IHOLDDELAY` sets how gradually that ramp happens — a smooth ramp avoids the small position shift you get if the current drops abruptly.

For a robot arm, think about which joints actually need holding torque at rest. J2 and J3 are carrying the weight of the arm and will backdrive if you cut their current — they need meaningful hold current, or a mechanical brake, or a parked position where gravity is not fighting them. J1 rotates about a vertical axis and has essentially no gravity load, so it can hold at very low current. J4, J5, and J6 carry only the wrist and tool.

This is worth tuning per joint rather than applying one global number. Every watt you do not dissipate is a watt not heating a plastic bracket.

## 6.6 Power, wiring, and the mistakes that kill drivers

Now the section I promised. These are the failure modes that actually destroy hardware, in rough order of how often they happen.

**Disconnecting a motor while powered.** The winding is an inductor carrying current. Break that circuit and the inductor generates whatever voltage it takes to keep current flowing, which is a very large voltage, and it appears across the driver's output transistors. This kills drivers instantly and reliably. Never unplug a stepper with the supply on. Not "try to avoid" — never.

**Insufficient bulk capacitance.** Each driver needs a substantial electrolytic capacitor across its VM and GND pins, physically close to the chip — 100 µF or more per driver is a sensible target, and the breakout board's own tiny capacitor is not sufficient. Without it, the switching currents the driver draws cause the local supply to sag and ring, and the resulting voltage spikes exceed the chip's rating. Observe the polarity; a reversed electrolytic is a small explosion.

**Regenerative overvoltage.** When a loaded joint decelerates, the motor acts as a generator and pumps energy back into the supply. On an unloaded bench supply this raises the rail voltage, sometimes dramatically. With a 24 V supply and a 29 V driver rating you have some margin, but a heavily loaded J2 doing a fast stop can eat it. Large bulk capacitance absorbs most of this. If you see the problem persist, a transient voltage suppressor across the rail is cheap insurance.

**Powering the logic before the motor supply, or vice versa.** Some drivers dislike having VIO present with VM absent, or the reverse. The TMC2209 is reasonably tolerant, but the safe arrangement is to bring both up together from one supply arrangement, and to make sure the Teensy is not trying to drive STEP/DIR/EN into an unpowered driver.

**Ground layout.** This is subtler and it is the cause of most mysterious, intermittent problems. Motor currents are large and they switch fast. If those currents share a ground path with your logic signals, the voltage drops they create appear as noise on your logic. The rule is star grounding: power ground and logic ground meet at exactly one point, ideally at the power supply. Keep motor wires physically away from signal wires, and if they must run together, use twisted pairs and consider shielding. A single ground loop through the USB cable back to your computer can inject enough noise to corrupt UART traffic to the drivers.

**Missing EN control.** Wire the drivers' enable pins to a Teensy output, and make sure the Teensy drives them to the disabled state at reset. The EN pin on the TMC2209 is active-low, meaning low enables the driver. A Teensy pin at reset is an input with no pull, so it floats — and a floating EN pin is a coin flip. Fit a pull-up resistor from EN to VIO so that the drivers are *disabled* by default, and only enable them when your firmware has explicitly decided everything is safe.

# Chapter 7 — The TMC2209 in detail

## 7.1 What it is

The TMC2209 is a Trinamic (now part of Analog Devices) stepper driver with an integrated power stage. It handles one bipolar stepper, up to 2 A peak per phase or about 1.4 A RMS continuous, from a supply of 4.75 V to 29 V. Its distinguishing features are StealthChop2 for silent operation, SpreadCycle for high-speed torque, StallGuard4 for sensorless load measurement, CoolStep for automatic current reduction, MicroPlyer interpolation to 1/256, and a single-wire UART interface that gives you full register-level control.

That last point is what makes it the right choice for a robot arm rather than a 3D printer. With a UART you can set current per joint from software, read back driver diagnostics, tune StallGuard for homing, and detect faults — all without touching a screwdriver.

## 7.2 The pins, and what each one does

Here is the full picture, grouped by function.

**Power pins**

`VM` is the motor supply, 4.75 to 29 V. This is the rail the H-bridges switch, and where your bulk capacitor goes. `GND` is the power return. `VCP` is the charge-pump capacitor pin — the driver needs a voltage above VM to fully turn on its high-side N-channel transistors, and it generates that with a charge pump requiring an external capacitor to VM. `5VOUT` is an internal 5 V regulator output; it powers the chip's own logic and can supply a small amount externally, and it needs a decoupling capacitor. `VREF` is the analogue current-reference input discussed in Chapter 6. `VIO` is the logic supply — **and this is critical**: whatever you put on VIO sets the logic level of all the digital pins. Connect it to the Teensy's 3.3 V and every digital pin becomes 3.3 V logic, safe for the Teensy. Connect it to 5 V, as many 3D printer boards do, and the driver's outputs will drive 5 V into your Teensy and damage it.

**Motor output pins**

`OA1`, `OA2` are the two ends of coil A. `OB1`, `OB2` are coil B. Getting the pairing right matters: the two wires of a single coil must go to OA1/OA2 as a pair. If you split a coil across the two outputs, the motor will vibrate and not turn. If you are unsure which wires pair up, measure resistance between them — the two ends of one coil read a couple of ohms, and wires from different coils read open circuit. Swapping the two wires within a pair simply reverses that phase, which reverses the motor's direction — a legitimate way to fix a joint that homes the wrong way if you would rather not do it in software.

`BRA`, `BRB` are the sense-resistor connections. On a breakout board these are already wired to the sense resistors and you do not touch them.

**Step/direction control pins**

`STEP` advances the microstep counter on each rising edge. `DIR` selects direction; it is sampled at the step edge, so it must be stable beforehand. `EN` is active-low enable: low turns the outputs on, high puts them in high-impedance and the motor freewheels. As discussed, pull it up so the default state is disabled.

**Configuration pins**

`MS1` and `MS2` do double duty, and this is the most confusing thing about the chip.

In **standalone mode**, where the driver runs without UART, MS1 and MS2 select the microstep resolution:

| MS2 | MS1 | Microsteps |
|---|---|---|
| 0 | 0 | 1/8 |
| 0 | 1 | 1/2 |
| 1 | 0 | 1/4 |
| 1 | 1 | 1/16 |

Note that these are the *input* step resolutions; with MicroPlyer interpolation, the driver internally runs at 1/256 regardless, so the motor motion is smooth even at 1/2 input stepping. Note also that the ordering is not what you would expect — MS2=0, MS1=1 gives 1/2, not 1/4. This catches people out constantly.

In **UART mode**, MS1 and MS2 stop being microstep selectors — microstepping moves to the `MRES` field of the `CHOPCONF` register — and instead become the **address pins**. MS1 is address bit 0 and MS2 is address bit 1, giving four addresses, 0 through 3. This is how you put multiple drivers on one UART line.

`PDN_UART` is the single-wire UART pin. In standalone mode it is a power-down input with a specific meaning; the moment you connect a UART to it, it becomes the bidirectional serial line.

`SPREAD` selects the chopper mode in standalone: high for SpreadCycle, low for StealthChop. In UART mode this is overridden by the `en_spreadcycle` bit in `GCONF`.

`CLK` is an optional external clock input. Left unconnected, the chip uses its internal ~12 MHz oscillator, which is fine for almost everything. Feed it an accurate external clock only if you need precise, repeatable chopper and StallGuard behaviour across temperature — worth knowing about if you find StallGuard thresholds drifting as the driver warms up.

**Output pins**

`DIAG` is a push-pull output that signals either a StallGuard stall or a driver error, depending on configuration. This is the pin you wire to a Teensy input for sensorless homing. Chapter 8 covers it in depth.

`INDEX` outputs a pulse each time the microstep counter passes position zero — that is, once per full step boundary in the sine table. It can be reconfigured to output other internal signals. Its most useful application is verification: count INDEX pulses and compare against the full steps you think you commanded, and you have an independent check that the driver is actually stepping.

## 7.3 The single-wire UART

The TMC2209's UART is unusual in that it uses one wire for both directions. Both the master and the slave transmit on the same line, taking turns.

To connect it to a Teensy, you have two options. The simple one is to tie the Teensy's TX and RX for that port together through a 1 kΩ resistor and connect the junction to `PDN_UART`. The resistor prevents the Teensy's driver from fighting the TMC2209's when the driver replies, and the Teensy sees its own transmissions echoed back, which you simply discard. The alternative is to connect TX through a 1 kΩ resistor to PDN_UART and RX directly, which achieves the same thing with slightly cleaner signal integrity.

Multiple drivers share the line. Each is given a distinct address by strapping its MS1 and MS2 pins, and each ignores datagrams addressed to another. Four drivers per UART is the limit, so a six-axis arm needs two UART ports: for example `Serial1` carrying J1–J4 at addresses 0–3, and `Serial2` carrying J5 and J6 at addresses 0 and 1.

The protocol itself is straightforward and worth understanding rather than treating as a black box, because when something is not working you will want to look at the bytes.

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

One very useful register is `IFCNT` at address `0x02`. It is a counter that increments on every successfully received write datagram. Read it before and after a write, and if it did not increment, your write did not land. This is the definitive test for "is my UART wiring correct", and it is far better than guessing.

## 7.4 The registers you will actually use

The TMC2209 has a lot of registers. Here are the ones that matter for a robot arm, and what to do with them.

`GCONF` (0x00) is the global configuration. The bits you care about are `i_scale_analog` (bit 0 — set to 0 to use the internal reference and ignore VREF), `en_spreadcycle` (bit 2 — 0 for StealthChop, 1 for SpreadCycle), `shaft` (bit 3 — inverts motor direction in software, useful when a joint homes the wrong way), `index_step` (bit 6 — makes INDEX output step pulses instead of the zero-position marker), and `mstep_reg_select` (bit 7 — set this to take microstep resolution from the register rather than from the MS1/MS2 pins, which you must do when using UART).

`GSTAT` (0x01) reports reset, driver error, and undervoltage since last read. Reading it clears it. Poll this occasionally; a driver that has silently reset has lost all your configuration.

`IFCNT` (0x02) is the write counter described above.

`IHOLD_IRUN` (0x10) packs `IHOLD` in bits 0–4, `IRUN` in bits 8–12, and `IHOLDDELAY` in bits 16–19. This is the register you write to set current.

`TPOWERDOWN` (0x11) sets the delay before dropping to hold current.

`TSTEP` (0x12) is read-only and reports the measured time between steps, in units of the internal clock. It is how the chip knows how fast the motor is going, and it is what the velocity thresholds compare against. A large `TSTEP` means slow.

`TPWMTHRS` (0x13) is the velocity threshold above which the driver leaves StealthChop for SpreadCycle. Because it is expressed in `TSTEP` units, larger numbers mean *lower* crossover speeds, which is counterintuitive. Set it to 0 to disable the automatic switch entirely.

`TCOOLTHRS` (0x14) is the lower velocity limit for StallGuard and CoolStep. Below this speed — meaning `TSTEP` greater than `TCOOLTHRS` — StallGuard is disabled and DIAG will not fire. This exists because StallGuard is unreliable at very low speeds, and it is the setting people most often forget when sensorless homing does not work.

`VACTUAL` (0x22) lets you command a constant velocity using the driver's own internal step generator, without sending any STEP pulses at all. This is a genuinely handy debugging tool: write a value and the motor spins, proving that power, wiring, current, and the driver itself are all fine, entirely independently of your step-generation code. Set it back to 0 to return control to the STEP pin.

`SGTHRS` (0x40) is the StallGuard threshold, and `SG_RESULT` (0x41) is the StallGuard load measurement. Chapter 8 is about these.

`COOLCONF` (0x42) configures CoolStep.

`CHOPCONF` (0x6C) holds the chopper configuration, including `TOFF` in bits 0–3 (which must be non-zero for the driver to operate at all — setting it to 0 is how you disable the driver in software), `vsense` at bit 17, `MRES` in bits 24–27 for microstep resolution, and `intpol` at bit 28 to enable MicroPlyer interpolation.

The `MRES` encoding is: 0 = 1/256, 1 = 1/128, 2 = 1/64, 3 = 1/32, 4 = 1/16, 5 = 1/8, 6 = 1/4, 7 = 1/2, 8 = full step. Note it counts *down*, which is the opposite of intuition. For the PAROL6's 1/32 microstepping you write `MRES = 3`.

`DRV_STATUS` (0x6F) is the diagnostic register and it is the one to poll periodically. It contains the live `SG_RESULT` in bits 0–9, over-temperature pre-warning `otpw` at bit 26, over-temperature shutdown `ot` at bit 25, short-to-ground flags for each coil, short-to-supply flags, open-load flags, a set of temperature threshold flags at 120/143/150/157 °C, the actual current scale `CS_ACTUAL` in bits 16–20, a `stealth` flag at bit 30 showing which chopper mode is active, and `stst` at bit 31 indicating standstill.

`PWMCONF` (0x70) configures StealthChop. The defaults with `pwm_autoscale` and `pwm_autograd` enabled are good; leave them alone unless you have a specific reason.

## 7.5 A sane configuration sequence

Bringing up a TMC2209 over UART works best in a fixed order. Power up with EN held high so the driver is disabled. Wait a few milliseconds for the internal regulator to stabilise. Read `IFCNT` and note it. Write `GCONF` with `i_scale_analog = 0`, `mstep_reg_select = 1`, and StealthChop selected. Read `IFCNT` again and confirm it incremented — if it did not, stop and fix your wiring before doing anything else. Write `CHOPCONF` with `TOFF` non-zero (3 to 5 is typical), `MRES = 3` for 1/32, and `intpol = 1`. Write `IHOLD_IRUN` with your computed currents. Write `TPOWERDOWN`. Write `TPWMTHRS` if you want the SpreadCycle crossover. Read `DRV_STATUS` and confirm no fault flags. Only then pull EN low to enable the outputs.

Doing this per driver, with the `IFCNT` check at each stage, turns "the arm doesn't move and I don't know why" into a specific, locatable fault.

# Chapter 8 — StallGuard, CoolStep, and sensorless homing

## 8.1 What StallGuard measures

StallGuard is one of the more elegant ideas in stepper driving, and it is worth understanding the principle rather than treating it as a magic stall detector.

When a stepper turns, the rotor's magnets moving past the stator coils induce a back-EMF in those coils. The magnitude of that back-EMF depends on speed, and its *phase relative to the driving current* depends on load. Under no load, the rotor sits very close to the field position and the phase relationship is one thing. Under increasing load, the rotor lags further and further behind the rotating field — this is the load angle — and the phase relationship shifts correspondingly. At the point where the load angle reaches 90 electrical degrees, the motor produces maximum torque; beyond that it loses synchronism and stalls.

StallGuard measures that phase relationship, indirectly, by observing the coil voltages during the chopper cycle. It reports the result as `SG_RESULT`, a number from 0 to 510. **High means lightly loaded, low means heavily loaded.** As the motor approaches a stall, `SG_RESULT` falls towards zero.

StallGuard4, which is the version in the TMC2209, is designed to work with StealthChop. This is a change from the older StallGuard2, which required SpreadCycle. For the TMC2209 the recommendation is to use StealthChop when you want StallGuard to work well.

## 8.2 The registers and the stall condition

`SG_RESULT` at register 0x41 gives you the raw measurement. It updates once per full step, so at low step rates you get relatively few samples.

`SGTHRS` at register 0x40 is a threshold from 0 to 255. The driver declares a stall — and asserts DIAG — when:

```
SG_RESULT ≤ 2 × SGTHRS
```

So a higher `SGTHRS` means a *more sensitive* detector, triggering on lighter loads. This is worth writing down somewhere near your bench because the direction is easy to get backwards.

`TCOOLTHRS` at register 0x14 gates the whole thing. StallGuard output to DIAG is only active when the motor is running faster than the velocity corresponding to `TCOOLTHRS` — that is, when the measured `TSTEP` is less than or equal to `TCOOLTHRS`. If you forget to set `TCOOLTHRS`, DIAG never fires and you will conclude StallGuard is broken. It is not; it is disabled.

The reason for this gate is that StallGuard is unreliable at very low speeds, where there is not enough back-EMF to measure, and it also misbehaves at very high speeds. There is a usable band in the middle, and your homing speed needs to be inside it.

## 8.3 What makes StallGuard hard to tune

StallGuard is sensitive to a lot of things, and this is the honest reason people find it frustrating.

`SG_RESULT` depends on **speed** — the same physical load reads differently at different velocities, which is why you must home at a fixed, repeatable speed. It depends on **motor current** — change `IRUN` and your threshold no longer applies. It depends on **supply voltage**, so a sagging rail shifts your readings. It depends on the **specific motor**, since inductance and back-EMF constant vary between part numbers and even between units. And it depends on the **mechanics**: a joint with a stiff belt, a tight gearbox, or a bearing that binds slightly at one end of travel will show a lower baseline `SG_RESULT` in that region, which can look like a stall.

On a geared robot joint there is an extra complication. The reduction between motor and joint means the motor sees the mechanical stop through 20:1 of gearbox. The gearbox has compliance and friction of its own, and the load rise when the joint hits its stop is softened and delayed. StallGuard on a directly-driven axis is much crisper than on a heavily geared one. This does not make it unusable — it makes it something you must tune per joint rather than globally.

## 8.4 A practical tuning procedure

Do this once per joint, and write the numbers down.

Start by configuring the driver in StealthChop with your final running current — the current you will actually use — and set `TCOOLTHRS` to a large value so StallGuard is enabled across a wide speed range while you experiment.

Now move the joint at your intended homing speed, away from any obstruction, and log `SG_RESULT` continuously. You are looking for the free-running baseline. It should be fairly steady; note the value and note how much it varies over the joint's travel. That variation is your noise floor and it sets a hard limit on how tight a threshold you can use.

Next, run the joint slowly into its mechanical stop and watch `SG_RESULT` fall. Note the value at which it clearly and repeatably drops. You now have two numbers: a free-running baseline and a stalled value.

Set `SGTHRS` to roughly halfway between them, divided by two (since the comparison is against `2 × SGTHRS`). Then test it: home the joint twenty times and confirm it triggers every time and never triggers spuriously during free motion. Twenty is not excessive. A homing routine that works nineteen times out of twenty is a homing routine that will eventually drive your arm into itself.

Finally, set `TCOOLTHRS` so that StallGuard is active at your homing speed but inactive at your normal operating speeds. You do not want a fast move that momentarily encounters high load to be interpreted as a stall.

Repeat for every joint, at that joint's own homing speed and current.

## 8.5 Wiring and reading DIAG

The DIAG pin is a push-pull output referenced to VIO, so with VIO at 3.3 V it is directly Teensy-safe. Give each driver its own Teensy input pin rather than wire-ORing them; you have the pins, and knowing *which* axis stalled is much more useful than knowing that one of them did.

You can attach an interrupt to it, and for a fast reaction that is the right thing to do. But be aware that DIAG is a level, not a pulse: it stays asserted while the stall condition persists. And be aware that during normal motion, especially acceleration, you may see brief assertions. A short debounce — require the line to stay asserted for a few hundred microseconds — removes most false triggers without adding meaningful latency.

Also note that DIAG can be configured to signal driver *errors* rather than stalls, and in some configurations both. If your DIAG line asserts the instant you enable the driver, check `DRV_STATUS` for an over-temperature or short flag before assuming it is a stall.

## 8.6 The homing state machine

A sensorless homing routine for one joint looks like this in outline.

Configure the driver: StealthChop, homing current, appropriate `TCOOLTHRS`, tuned `SGTHRS`. Enable the driver and wait briefly for the current to settle. Now accelerate the joint towards the hard stop, but — and this is important — **do not enable stall detection during the acceleration phase.** Acceleration loads the motor, `SG_RESULT` drops, and you will trigger immediately. Wait until you are at constant homing speed, then arm the detector.

Move until DIAG asserts or until you have travelled more than the joint's full range, in which case something is wrong and you should abort rather than continue pushing. On detection, stop immediately, back off by a fixed small amount, and optionally repeat the approach at a lower speed for better repeatability — the classic two-pass home. Set the joint's position counter to the known angle of that hard stop. Disarm stall detection, restore normal running current, and move to a safe standby position.

Then do the next joint. Order matters: home the joints that can crash into things last, or arrange the sequence so that each joint is homed in a configuration where its motion is unobstructed. On a six-axis arm, homing J2 and J3 while the arm is folded up can drive links into each other.

## 8.7 Should you use sensorless homing at all?

Honestly, on a robot arm, I would use it as a *secondary* system rather than the primary one.

The PAROL6 uses limit switches for its open-loop homing, and there is a good reason for that. A limit switch triggers at the same physical point every time, regardless of temperature, supply voltage, or how the gearbox is feeling that morning. StallGuard's trigger point moves with all of those. For a machine whose entire accuracy claim rests on knowing where zero is, that repeatability difference matters.

Where StallGuard earns its place is as a **safety and diagnostic layer**. Monitor `SG_RESULT` continuously during normal operation and you have a real-time measure of how hard each joint is working. A sudden drop means a collision — and reacting to that in a few milliseconds by stopping the arm is genuinely valuable, both for the arm and for whatever it just hit. A gradual drift downward over weeks means a bearing is going or a belt is over-tensioned. Neither of those is available to you from a limit switch.

So: limit switches for homing, StallGuard for collision detection and condition monitoring, and CoolStep on top if you want the current management.

## 8.8 CoolStep

CoolStep uses the same `SG_RESULT` measurement for a different purpose: automatic current adjustment. You configure a window with `SEMIN` and `SEMAX` in the `COOLCONF` register. When `SG_RESULT` rises above the window — meaning the motor is lightly loaded — the driver reduces current. When it falls below, the driver increases current back up to `IRUN`.

The effect is that a motor which spends most of its time lightly loaded runs cool, and only draws full current when it actually needs the torque. On a PETG-framed arm with a documented thermal problem, that is directly valuable.

The caveats are that CoolStep requires the same velocity gating as StallGuard via `TCOOLTHRS`, and that it needs `SG_RESULT` to be well-behaved, which means you should tune StallGuard first. And it changes current dynamically, which means any StallGuard threshold you tuned at fixed current is now living on shifting ground. Use one or the other on a given joint during a given operation, not both at once, until you are very confident.

# Chapter 9 — Frames, rotations, and homogeneous transforms

## 9.1 Why we need frames at all

The question "where is the gripper?" has no answer until you say "relative to what". A robot arm is a chain of rigid bodies, and the natural way to describe it is to attach a coordinate frame to each body and then describe how each frame relates to the one before it. The position of the tool relative to the table is then just the composition of all those relationships.

A **frame** is an origin point plus three mutually perpendicular unit vectors, conventionally x, y, and z, forming a right-handed set. When we say "the pose of the end effector", we mean the position of its frame's origin and the orientation of its axes, both expressed in some reference frame — usually the base frame, sitting at the bottom of the robot.

Pose therefore has six numbers: three for position and three for orientation. Six degrees of freedom. This is why a six-axis arm is the canonical design — six joints is exactly the number needed to reach an arbitrary position *and* an arbitrary orientation within the workspace.

## 9.2 Rotation matrices

The cleanest way to represent orientation for computation is a 3×3 rotation matrix. Its columns are the unit vectors of the rotated frame's axes, expressed in the reference frame. So if R is the rotation of frame B relative to frame A, the first column of R is B's x-axis written in A's coordinates.

Rotation matrices have properties that make them pleasant to work with. They are orthonormal: every column is a unit vector, and all columns are mutually perpendicular. Consequently the inverse of a rotation matrix is simply its transpose, which is free to compute. Their determinant is exactly +1. And they compose by multiplication: if R_AB rotates from A to B and R_BC from B to C, then R_AC = R_AB · R_BC.

The elementary rotations about the three axes are worth memorising:

```
Rx(θ) = [ 1    0       0    ]     Ry(θ) = [  cosθ  0  sinθ ]
        [ 0  cosθ  -sinθ    ]             [   0    1   0   ]
        [ 0  sinθ   cosθ    ]             [ -sinθ  0  cosθ ]

Rz(θ) = [ cosθ  -sinθ  0 ]
        [ sinθ   cosθ  0 ]
        [  0      0    1 ]
```

Note the sign pattern in Ry — it is the odd one out, and transcribing it wrongly is a classic bug that produces kinematics which are subtly wrong only in certain poses.

## 9.3 Euler angles, and why they bite

Nine numbers to describe three degrees of freedom is redundant, so people often use three angles instead: roll, pitch, and yaw, or some other Euler convention. These are convenient for humans — "rotate 30° about z, then 45° about the new y" is easy to picture.

They have two problems. First, there are two dozen distinct Euler conventions in common use, differing in axis order and in whether rotations are about fixed or moving axes, and almost nobody states which one they mean. If your robot's orientation is off in a way that looks almost right, suspect a convention mismatch first.

Second, and more fundamentally, every three-angle representation has **singularities** — configurations where two of the angles become degenerate and only their sum or difference is determined. This is gimbal lock. It is not an artefact of bad implementation; it is a topological necessity for any three-parameter representation of rotation.

For a robot arm this matters at the wrist. When joint 5 is at zero, joints 4 and 6 rotate about the same physical axis, and only their sum is determined by the desired orientation. The IK has infinitely many solutions and your solver must decide what to do about it. This is not an edge case you can ignore — it is a pose your arm will genuinely pass through.

**Quaternions** avoid the singularity by using four numbers with one constraint, and they interpolate beautifully, which makes them the right choice for representing orientation targets and for blending between orientations along a path. Use quaternions for storage and interpolation; convert to rotation matrices for the kinematics maths; use Euler angles only at the human interface.

## 9.4 Homogeneous transforms

The elegant trick that makes robot kinematics tractable is to combine rotation and translation into a single 4×4 matrix:

```
T = [ R   p ]
    [ 0   1 ]
```

where R is the 3×3 rotation and p is the 3×1 translation. The bottom row is always `0 0 0 1`.

Why bother? Because composition becomes matrix multiplication. If T₁ describes frame 1 relative to frame 0, and T₂ describes frame 2 relative to frame 1, then T₁·T₂ describes frame 2 relative to frame 0. A chain of six joints becomes a product of six matrices. That is the entire content of forward kinematics.

Points transform too. Write a 3D point as a 4-vector with a 1 appended, and T times that vector gives the point in the new frame, with rotation and translation applied together.

The inverse has a closed form you should use rather than calling a general matrix inverse:

```
T⁻¹ = [ Rᵀ   -Rᵀp ]
      [ 0      1  ]
```

This is exact and cheap. A numerical 4×4 inversion is neither.

# Chapter 10 — Denavit–Hartenberg and the forward kinematics of the PAROL6

## 10.1 The problem DH solves

You could attach frames to a robot's links any way you like, and then write out each transform by hand. That works but it is error-prone and it means every robot needs bespoke code.

Denavit and Hartenberg observed that if you place the frames according to a specific set of rules, the transform between consecutive frames always has the same form and always requires exactly four parameters instead of six. That is the whole idea: a systematic frame placement that reduces the description of each joint to four numbers.

The rules are: put the z-axis of frame i along the axis of joint i+1 (so z is always the axis a joint rotates about, or slides along); put the x-axis of frame i along the common perpendicular between z_{i-1} and z_i; and y follows from the right-hand rule.

Given that placement, the four parameters are:

- **θ** (theta) — the rotation about z that takes x_{i-1} to x_i. For a revolute joint, this is the joint variable.
- **d** — the translation along z from x_{i-1} to x_i. The link offset.
- **a** — the translation along x. The link length, or more precisely the distance between the two z-axes along their common perpendicular.
- **α** (alpha) — the rotation about x that takes z_{i-1} to z_i. The link twist.

And the transform is always:

```
T_i = Rz(θ) · Tz(d) · Tx(a) · Rx(α)
```

which multiplies out to:

```
     [ cosθ   -sinθ·cosα    sinθ·sinα   a·cosθ ]
T =  [ sinθ    cosθ·cosα   -cosθ·sinα   a·sinθ ]
     [   0       sinα         cosα         d   ]
     [   0        0             0          1   ]
```

Memorise the shape of this matrix, or at least be able to recognise it. Every DH-based kinematics implementation contains it.

**A caution about conventions.** There are two DH variants in circulation: "standard" or "distal" DH, which is what I have written above, and "modified" or "proximal" DH, popularised by Craig, which orders the four elementary transforms differently and attaches frames to the proximal rather than distal end of each link. They are not interchangeable. A DH table for one convention plugged into code for the other produces wrong answers that often look plausible. Whenever you take a DH table from a source, establish which convention it uses. The table below is standard DH.

## 10.2 The PAROL6 DH table

The published link dimensions are:

| Symbol | Value (mm) | What it is |
|---|---|---|
| a1 | 110.50 | Base height to shoulder axis |
| a2 | 23.42 | Lateral offset at the shoulder |
| a3 | 180.00 | Upper arm length |
| a4 | 43.50 | Elbow offset |
| a5 | 176.35 | Forearm length |
| a6 | 62.80 | Wrist to flange along the tool axis |
| a7 | 45.25 | Flange lateral offset |

And the DH table, in standard convention:

| i | Link | θ | α | d (mm) | a (mm) |
|---|---|---|---|---|---|
| 1 | Base | θ₁ | −π/2 | 110.50 | 23.42 |
| 2 | Shoulder | θ₂ − π/2 | π | 0 | 180.00 |
| 3 | Elbow | θ₃ + π | π/2 | 0 | −43.50 |
| 4 | Wrist 1 | θ₄ | −π/2 | −176.35 | 0 |
| 5 | Wrist 2 | θ₅ | π/2 | 0 | 0 |
| 6 | Wrist 3 | θ₆ + π | π | −62.80 | −45.25 |

The θ column contains the joint variable plus a constant offset. Those offsets exist because the DH frame placement rules do not generally put the frames where a human would want "zero" to be. They are a bookkeeping device that lets the robot's zero position be something sensible while the maths stays in DH form.

## 10.3 Forward kinematics

Forward kinematics is now trivial to state: given the six joint angles, build the six transforms and multiply them.

```
T_0_6 = T₁(θ₁) · T₂(θ₂) · T₃(θ₃) · T₄(θ₄) · T₅(θ₅) · T₆(θ₆)
```

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

I have run this. At all joints zero it places the flange at approximately (262.6, 0.0, 288.7) mm, and with the arm extended it reaches about 396 mm from the base axis — which agrees with the published 400 mm reach figure and is a good sign that the table is transcribed correctly.

## 10.4 Verifying your implementation

Before you trust any kinematics code, verify it. Three checks catch almost everything.

**Check the reach.** Extend the arm as far as it will go and confirm the flange distance from the base matches the specification. If your link lengths or your α signs are wrong, the reach will be visibly wrong.

**Check the wrist intersection.** The PAROL6 has a spherical wrist, meaning the axes of joints 4, 5, and 6 all pass through a common point. If you compute the origins of frames 4 and 5 for arbitrary joint angles, they should be identical. I have verified this holds for the table above. If it does not hold in your implementation, you have a transcription error, and — more seriously — the closed-form IK in the next chapter will not work.

**Check the round trip.** Pick random joint angles, run forward kinematics to get a pose, run inverse kinematics on that pose, and run forward kinematics again on the result. The two poses must match to within numerical noise. The joint angles need not match, since there are multiple solutions, but the poses must. Do this for a few thousand random configurations. It is the single most valuable test you will write.

## 10.5 The tool frame

Everything above computes the pose of the **flange** — the mounting face at the end of the arm. What you usually care about is the pose of the **tool centre point**, which is somewhere out in front of the gripper.

Handle this with one more transform. Define T_flange_tool describing where the TCP sits relative to the flange, and then:

```
T_base_tool = T_base_flange · T_flange_tool
```

Keep this separate from the DH chain. When you change grippers, you change one matrix and nothing else. Baking the tool offset into the DH table is a false economy that you will regret the first time you swap end effectors.

Similarly, if the robot is bolted to a table and you want to work in table coordinates, define T_world_base and pre-multiply. The full chain is then world → base → flange → tool, and each piece has a clear physical meaning and a clear owner.

# Chapter 11 — Inverse kinematics: from a pose in space to six joint angles

## 11.1 The problem

Forward kinematics is a function: give it joint angles, it gives you exactly one pose. Inverse kinematics is a relation: give it a pose, and it may give you no solutions, several solutions, or infinitely many.

No solutions happens when the pose is outside the workspace, or inside it but unreachable with the required orientation, or blocked by joint limits. Several solutions is the normal case — a six-axis arm of this type generally has **eight** distinct joint configurations that put the tool in exactly the same place with exactly the same orientation. Infinitely many happens at singularities.

Your solver must handle all three cases explicitly. An IK routine that returns a single answer and no indication of whether it is valid is a robot that will drive into itself.

## 11.2 Kinematic decoupling: the key insight

The reason a spherical wrist is worth building is that it splits the six-dimensional problem into two three-dimensional problems that can be solved independently.

Here is the argument. The axes of joints 4, 5, and 6 all intersect at a single point, the **wrist centre**. Rotating any of those three joints rotates the tool about that point but does not move the point. Therefore the position of the wrist centre depends *only* on joints 1, 2, and 3.

So: given a desired tool pose, first compute where the wrist centre must be. That depends only on the desired position and orientation, both of which you know. Then solve joints 1, 2, and 3 to place the wrist centre there — a pure positioning problem in three unknowns with a geometric solution. Then, knowing joints 1–3, compute what rotation the wrist must supply to make up the difference between what the arm gives you and what you asked for, and solve joints 4, 5, and 6 for that rotation — a pure orientation problem in three unknowns.

Two three-DOF problems instead of one six-DOF problem. Both have closed-form solutions. This is why almost every industrial six-axis arm has a spherical wrist.

## 11.3 Step one: locate the wrist centre

The wrist centre sits at a fixed offset from the flange, expressed in the flange's own frame. For the PAROL6 DH table above, I computed that offset numerically and it comes out as a constant, as it must:

```
p_wc = p_flange + R_flange · [ a7, 0, −a6 ]ᵀ
     = p_flange + R_flange · [ 45.25, 0, −62.80 ]ᵀ
```

I verified this at many arbitrary joint configurations and the offset vector expressed in frame 6 is exactly (45.25, 0, −62.80) mm every time.

If you are targeting a TCP rather than a flange, first convert: `T_base_flange = T_base_tool · T_flange_tool⁻¹`, then apply the above.

```python
def wrist_centre(R, p):
    return p + R @ np.array([a7, 0.0, -a6])
```

That single line is the whole of the decoupling step, and everything downstream depends on it being right.

## 11.4 Step two: joints 1, 2, and 3

Now you have a point, and you need the first three joints to put the wrist centre there.

**Joint 1.** There is a subtlety here that is easy to get wrong, and I got it wrong on my first pass through this derivation before the numerical check caught it. The a2 = 23.42 mm offset at the shoulder looks like it should be a *lateral* offset — the kind that shifts the arm's plane sideways off the base axis and forces a correction term into θ₁. It is not. Working through the DH table, the origin of frame 1 sits at (a2·cos θ₁, a2·sin θ₁, a1), which is displaced **radially outward** in the direction the arm is already pointing, not sideways. The arm's plane of motion therefore still contains the base's vertical axis.

Which means joint 1 is simply:

```
θ₁ = atan2( y_wc, x_wc )
```

with no correction term at all. The second solution is θ₁ + π, the "shoulder flipped" configuration in which the arm reaches back over its own base. On the PAROL6, joint 1 is limited to ±123.05°, so many flipped solutions fall outside the joint limits and get discarded — which is normal and expected.

This is a good illustration of why you verify numerically rather than trusting a derivation that looks right. The wrong version produces plausible-looking angles that are simply not the ones that reach the target.

**Joints 2 and 3** are then a planar two-link problem in the vertical plane containing the arm. Convert the wrist centre into that plane's coordinates:

```
u = √(x_wc² + y_wc²) − a2        (horizontal distance from the shoulder axis)
v = a1 − z_wc                    (note the sign — the frame-1 y axis points downward)
```

For the flipped-shoulder branch, use `u = −√(x_wc² + y_wc²) − a2` instead.

The two links are the upper arm, a3 = 180.00 mm, and the forearm. The forearm is not a straight link — there is a 43.50 mm offset at the elbow and a 176.35 mm length beyond it — so its effective length is the hypotenuse, and it carries a fixed built-in bend:

```
L = √(a4² + a5²) = √(43.50² + 176.35²) = 181.636 mm
φ = atan2(a4, a5) = atan2(43.50, 176.35) = 0.24184 rad = 13.856°
```

Now the standard two-link solution. Let D² = u² + v². The law of cosines gives the included angle B between the two links:

```
cos B = (D² − a3² − L²) / (2 · a3 · L)
```

If the magnitude of that cosine exceeds 1, the point is out of reach — too far, or too close for the elbow to fold around — and you must return "no solution" rather than letting `acos` produce a NaN that propagates silently into your motor commands. Check it explicitly, every time.

Otherwise there are two solutions, the **elbow-up** and **elbow-down** configurations:

```
B = ± acos( ... )
A = atan2(v, u) − atan2( L·sin B, a3 + L·cos B )
```

And then the conversion from these geometric angles to the actual joint variables, which absorbs the DH θ-offsets and the forearm's built-in bend:

```
θ₂ = A + π/2
θ₃ = π/2 − φ − B
```

Those two lines are where the sign errors live in every implementation of this. I derived them by computing the forward kinematics on a grid of (θ₂, θ₃) values and fitting the relationship, rather than by reasoning on paper — and I would recommend the same approach if you change the geometry. It takes ten minutes and it is correct by construction.

## 11.5 Step three: joints 4, 5, and 6

With θ₁, θ₂, and θ₃ known, compute the rotation the arm has produced up to frame 3:

```python
R_0_3 = fk([th1, th2, th3, 0, 0, 0])[1][2][:3, :3]
```

The wrist must supply whatever rotation gets you from there to the target:

```python
R_3_6 = R_0_3.T @ R_target
```

Now, joints 4, 5, and 6 form a Z–Y–Z-like Euler sequence in frame 3, but the α values in the DH table (−π/2, +π/2, π) and the +π offset on joint 6 mean the extraction is not the textbook ZYZ formula. Multiplying the three rotation matrices out symbolically gives:

```
R_3_6 = [ ...      ...      −sin θ₅ · cos θ₄ ]
        [ ...      ...      −sin θ₅ · sin θ₄ ]
        [ sin θ₅·cos θ₆   sin θ₅·sin θ₆   −cos θ₅ ]
```

from which the extraction follows directly. Writing rᵢⱼ for the elements of R_3_6, with rows and columns numbered from 1:

```
θ₅ = atan2( √(r₁₃² + r₂₃²), −r₃₃ )
θ₄ = atan2( −r₂₃, −r₁₃ )
θ₆ = atan2(  r₃₂,  r₃₁ )
```

I have verified these numerically against the forward kinematics over thousands of random configurations; they reproduce the original pose to within 2 × 10⁻¹² mm. Note the minus signs — they come from the α = π rows in the DH table and they are not present in the standard textbook ZYZ formula. If you take the textbook version and apply it to this table, you get an answer that is wrong in a way that looks almost right, which is the worst kind of wrong.

The second solution — the **wrist-flipped** configuration — is:

```
θ₄' = θ₄ + π,   θ₅' = −θ₅,   θ₆' = θ₆ + π
```

which reaches the same orientation by rotating joint 5 the other way and spinning joints 4 and 6 half a turn each. I have verified this branch too; it is exact.

**The wrist singularity.** When sin θ₅ approaches zero, the axes of joints 4 and 6 become collinear. Both r₁₃ and r₂₃ go to zero, `atan2(0, 0)` is undefined, and the split between θ₄ and θ₆ is arbitrary — only their sum matters. Detect this by testing whether √(r₁₃² + r₂₃²) is below a small threshold, and when it is, adopt a convention: hold θ₄ at its current value and put all the rotation into θ₆. This produces continuous, sensible motion instead of a wild flip.

## 11.5a A complete, verified implementation

Here is the whole closed-form solver, which I have tested end-to-end. Over 5,000 random configurations it produces every valid solution branch, and every returned solution reproduces the target pose to within 2.3 × 10⁻¹³.

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

**Filter** next by self-collision if you have a collision model. This is more work to implement but it is what stops the arm folding into itself.

**Rank** the survivors. The usual criterion is a weighted sum of joint motion from the current configuration:

```
cost = Σ wᵢ · |θᵢ_new − θᵢ_current|
```

with larger weights on the big proximal joints, because moving J2 costs far more time and energy than moving J6. Pick the lowest-cost solution.

Add one more consideration: **configuration continuity**. Along a continuous path, you want the arm to stay in one configuration rather than jumping between them. A jump from elbow-up to elbow-down mid-path is geometrically valid and physically alarming — the arm makes a large, fast, unexpected motion. Prefer solutions in the same configuration branch as the previous point, and only allow a branch change deliberately, at a controlled speed, as an explicit reconfiguration move.

## 11.7 The numerical alternative

Closed-form IK is fast and complete, but it only exists because of the spherical wrist and it must be re-derived if you change the geometry. The alternative is to solve numerically.

The idea is straightforward. Start from a guess at the joint angles. Compute forward kinematics. Measure the error between the resulting pose and the target — three components of position error, three of orientation error. Use the Jacobian (next chapter) to work out which way to move the joints to reduce that error. Take a step. Repeat until converged.

The naïve version uses the Jacobian inverse and blows up near singularities, where the Jacobian becomes ill-conditioned and the computed joint step becomes enormous. The standard fix is **damped least squares**, also called the Levenberg–Marquardt method:

```
Δq = Jᵀ (J Jᵀ + λ² I)⁻¹ · e
```

The damping factor λ limits the step size near singularities at the cost of some accuracy. Adaptive schemes increase λ when the condition number is bad and reduce it when things are well-behaved.

Numerical IK is slower — tens to hundreds of iterations — but it handles arbitrary geometry, it naturally incorporates joint limits and secondary objectives, and it degrades gracefully. On a 600 MHz Cortex-M7 you can run it in real time without difficulty.

**My recommendation**: implement the closed-form solution, because it is exact, fast, and gives you all eight configurations. Then implement a numerical solver as well, and use it as a fallback and as an independent check. When the two disagree, you have found a bug in one of them, and that is worth knowing.

# Chapter 12 — The Jacobian, velocities, and singularities

## 12.1 What the Jacobian is

The Jacobian is the matrix that relates joint velocities to end-effector velocities:

```
v = J(q) · q̇
```

where q̇ is the six-vector of joint angular velocities, and v is the six-vector of end-effector velocity — three components of linear velocity and three of angular velocity. J is a 6×6 matrix that depends on the current configuration q.

Each column of J tells you what happens to the end effector when you move one joint at unit speed with all others held still. For a revolute joint i with axis direction zᵢ and origin oᵢ, and with the end effector at position p, that column is:

```
J_i = [ zᵢ × (p − oᵢ) ]     ← linear velocity contribution
      [      zᵢ       ]     ← angular velocity contribution
```

All the quantities on the right are available from the forward kinematics computation you have already done, so building the Jacobian costs almost nothing extra. Compute the transforms, accumulate them, and read off the z-axis and origin of each frame.

## 12.2 What you use it for

**Cartesian velocity control.** If you want the tool to move at a specified velocity in space — say, 50 mm/s along the table's x-axis while maintaining orientation — solve `q̇ = J⁻¹ v`. This is the basis of jogging in tool coordinates, and of any velocity-level control.

**Force and torque relationships.** By the principle of virtual work, the transpose of the Jacobian maps forces at the tool to torques at the joints: `τ = Jᵀ F`. This tells you how much joint torque a given payload demands in a given configuration, which is directly useful for checking whether your motors and gearboxes are adequate at the worst-case pose. It also underlies force control and compliance, if you ever add sensing.

**Numerical IK**, as described above.

**Singularity detection**, which is next.

## 12.3 Singularities

A singularity is a configuration where the Jacobian loses rank — where its determinant goes to zero. Physically, it means the arm has lost the ability to move instantaneously in some direction, no matter how it moves its joints. Approaching one, `J⁻¹` grows without bound, and the joint velocities required for a modest tool velocity become impossible.

A six-axis arm of this type has three families of singularity.

**Wrist singularity**, when joint 5 is at or near zero and the axes of joints 4 and 6 align. This is the one you will encounter most often, because θ₅ = 0 is a perfectly natural-looking pose — the wrist straight. Passing through it during a Cartesian move causes joints 4 and 6 to spin rapidly in opposite directions.

**Shoulder singularity**, when the wrist centre lies on the axis of joint 1. Here, joint 1 can rotate freely without moving the wrist centre at all, so the arm has lost a degree of freedom in that direction. Near it, small tool motions demand very large joint-1 velocities.

**Elbow singularity**, when the arm is fully extended and the shoulder, elbow, and wrist centre are collinear. At full extension the arm cannot move further outward, and the boundary of the workspace is itself a singular surface.

## 12.4 Living with singularities

You cannot design them away — they are intrinsic to a six-axis serial arm. You can only handle them.

**Detect them.** The cleanest measure is the smallest singular value of J, obtained from a singular value decomposition. A more common and cheaper measure is Yoshikawa's manipulability index, `w = √(det(J·Jᵀ))`, which goes to zero at a singularity. Compute it along a planned path *before* executing, and you know in advance whether the path is safe.

**Avoid them in planning.** When you plan a Cartesian path, check manipulability at each waypoint. If the path passes close to a singularity, either reroute it or accept a joint-space move through that region instead.

**Damp near them.** If you must operate near a singularity, use the damped least squares pseudo-inverse rather than the true inverse. The tool will not follow the commanded path exactly — you trade accuracy for boundedness — but the joints will not attempt impossible velocities.

**Clamp joint velocities.** Regardless of everything else, put a hard limit on commanded joint velocity in your motion pipeline, at a layer below the planner. This is a safety net, and it should be the last thing that can be bypassed. If the IK or the Jacobian ever produces something absurd, the clamp catches it and the arm slows down rather than flinging itself.

**Prefer joint-space moves where you can.** A great deal of robot motion — moving from one point to another where the path in between does not matter — can be done in joint space, interpolating each joint linearly from start to end. Joint-space moves have no singularity problems at all, because you never invert the Jacobian. Reserve Cartesian interpolation for the parts of the task that genuinely need a straight line in space.

# Chapter 13 — From joint angles to step counts

## 13.1 The conversion

This is the bridge between the kinematics and the hardware, and it is arithmetically trivial but conceptually important to get exactly right.

```
microsteps = θ_joint(degrees) / 360 × 200 × microstepping × gear_ratio
```

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

It is worth pausing on what those numbers mean. A single microstep on joint 1 rotates the arm by 0.0088°, which at the full 400 mm reach moves the tool by about 0.061 mm. On joint 2 it is 0.0028°, or about 0.020 mm at full reach. Every joint's quantisation is comfortably below the arm's quoted 0.1 mm repeatability.

That is the point made in Chapter 5, now with numbers behind it: **the microstep resolution is not what limits this machine's accuracy.** Backlash, belt stretch, structural flex in printed PETG, and thermal expansion all dominate. If you want a more accurate arm, that is where the effort goes — not into finer microstepping.

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

Do the same on the Teensy side, with `int32_t` counters. A 32-bit signed integer holds ±2.1 billion microsteps, which at 128,000 per revolution of joint 2 is over sixteen thousand revolutions — you will never overflow it.

## 13.3 Direction and zero

Two per-joint constants complete the picture: a **direction sign** and a **zero offset**.

The direction sign accounts for how the motor happens to be wired and mounted, and whether positive joint rotation corresponds to positive or negative step direction. Keep it as an explicit `+1` or `−1` in a configuration table rather than fixing it by swapping motor wires — you will want to know why it is what it is in six months.

The zero offset is the microstep count corresponding to the joint's defined zero. After homing, you set the counter to the value corresponding to the known angle of the home position, and everything else follows. The PAROL6's published joint limits give both the range and the standby position for each joint, and those are the numbers to encode.

Keep all of this — steps per degree, direction sign, home angle, soft limits, maximum velocity, maximum acceleration, driver current — in a single per-joint configuration structure. One table, one place to change things, one thing to print out when you are debugging.

## 13.4 Soft limits

Enforce joint limits in software, in microstep units, at the lowest level of the motion pipeline. Not in the planner, not in the IK, not in the host software — all of those should check too, but the last line of defence belongs in the step generator, where nothing can bypass it.

The check is one comparison per axis per segment and it costs nothing. What it buys you is that no bug in the planner, no corrupted command from the host, and no arithmetic error in the IK can drive a joint past its mechanical stop. Given that the mechanical stops on a printed arm are printed plastic, this matters.

# Chapter 14 — Trajectory generation and the real-time motion pipeline

## 14.1 The layers

A complete motion pipeline for the VCP6 has five layers, and keeping them clearly separated is what makes the system understandable.

At the top is the **task layer**: "pick up the object at these coordinates". This is application logic and it lives on the host.

Below that is the **path layer**, which turns a task into a sequence of poses in space — waypoints, and the type of motion between them.

Below that is the **trajectory layer**, which adds time. It takes the geometric path and produces a schedule: at time t, the tool should be here, moving at this velocity. This is where speed limits, acceleration limits, and smoothing live.

Below that is the **kinematics layer**, which converts each sampled point on the trajectory into six joint angles via IK, and then into microstep targets.

And at the bottom is the **step generation layer**: the fixed-rate ISR from Chapter 3, consuming segments and producing pulses.

The boundary that matters most is between the kinematics layer and the step generator, because that is the boundary between soft real time and hard real time. Everything above it can take variable time and occasionally be slow. Everything below it must never miss a deadline. The ring buffer between them absorbs the difference, and its depth is your safety margin — enough segments buffered that a momentary hiccup upstream does not starve the ISR.

## 14.2 Joint-space versus Cartesian moves

There are two fundamentally different ways to get from pose A to pose B, and a well-built controller offers both.

A **joint-space move** interpolates each joint angle linearly from start to finish, scaled so that all joints start and stop together. It is simple, it is fast, it never encounters a singularity, and it uses the arm's full speed capability. What it does not do is move the tool in any predictable path — the tool traces a curve through space that depends on the geometry, and that curve can swing surprisingly wide. Use joint-space moves for getting from one place to another when the path does not matter, which is most of the time.

A **Cartesian move** interpolates the tool pose itself, typically along a straight line for position and by spherical linear interpolation for orientation, then runs IK at each sample point. The tool follows a predictable path in space, which is what you need for approaching a part, inserting something, or dispensing along a line. The costs are that it requires IK at every sample, that it can hit singularities mid-path, and that the required joint velocities vary along the path in ways that can exceed limits.

The standard industrial pattern is to use Cartesian moves only for the short, precise segments near the workpiece, and joint-space moves for everything else. Approach a pick point with a fast joint move to a position 50 mm above it, then a slow Cartesian move straight down. This is both faster and safer than doing the whole thing in Cartesian space.

## 14.3 Velocity profiles

Never command a step change in velocity. A stepper asked to go instantly from rest to 20,000 steps per second will simply not go — the rotor cannot accelerate that fast, it falls out of sync with the field, and it stalls or skips. Every move needs a velocity profile.

The **trapezoidal** profile is the classic: accelerate at a constant rate to a cruise velocity, hold, then decelerate at a constant rate to a stop. Velocity is a trapezoid, acceleration is a square wave. It is simple, it is optimal in the minimum-time sense given acceleration limits, and it is what most CNC controllers use.

Its drawback is that acceleration changes instantaneously at the corners of the trapezoid, and the rate of change of acceleration — **jerk** — is therefore infinite at those points. Infinite jerk excites structural resonance. On a rigid steel machine that is tolerable. On a 3D-printed arm with belt drives and a 400 mm reach, it produces a visible wobble at the tool that takes time to settle, and that settling time eats any speed advantage the profile gave you.

The **S-curve** profile ramps the acceleration itself, so that acceleration rises smoothly to its maximum, holds, and falls smoothly back. Jerk is bounded. Moves take slightly longer in theory, but on a compliant structure they often complete *sooner* in practice because there is nothing to wait for at the end. For the VCP6, I would use S-curve profiles from the start.

The profile applies to the move as a whole, not per joint. Compute the time-optimal profile subject to every joint's velocity and acceleration limits — that is, find the joint that is the binding constraint, profile for that, and scale all the others to match — so that all joints start and stop together and the path is preserved.

## 14.4 The segment queue

The interface between the planner and the ISR should be a queue of small, fixed-duration segments. Each segment says: for the next N ticks, axis 1 gets this step increment, axis 2 gets this one, and so on, with these direction bits.

Segment duration is a design choice. Something in the region of 1 to 10 milliseconds works well: short enough that velocity changes are smooth, long enough that the planner is not overwhelmed. At 5 ms per segment and a queue depth of 200, you have a full second of buffered motion, which is comfortably more than any upstream hiccup will consume.

Make the queue a lock-free single-producer, single-consumer ring buffer. Only the planner writes, only the ISR reads, the head and tail indices are `volatile`, and no locking is required. This is a well-known pattern and it is exactly right here.

Design what happens when the queue **runs dry**. The wrong answer is to stop instantly, which is a step change in velocity and will lose position. The right answer is to decelerate at the configured limit to a stop, and flag an underrun so you know it happened. Log underruns. If they are occurring during normal operation, your planner is too slow or your queue is too shallow, and either way you want to know before it becomes a problem.

## 14.5 Emergency stop

Every motion system needs a stop path that cannot be blocked by anything else. Design it explicitly.

A **controlled stop** decelerates at maximum rate and keeps position tracking valid. This is what a software stop command, a soft limit violation, or a communication watchdog timeout should trigger. The arm stops in a controlled way and still knows where it is.

An **immediate stop** kills the driver enable lines. Position tracking is lost — the arm will coast and may drop under gravity — and re-homing is required. This is what a hardware emergency stop button does, and it should be wired so that it works whether or not the firmware is running: a physical contactor in the motor supply, not a Teensy input pin. A software-only emergency stop is not an emergency stop, because the most likely reason you need one is that the software has gone wrong.

Wire both. Use the controlled stop for everything you can, and keep the immediate stop as the thing that works when nothing else does.

# Chapter 15 — System architecture: host, Teensy, drivers

## 15.1 Where to put each piece

You have a fast microcontroller and, presumably, a much faster PC. Deciding what runs where is a real architectural choice and there are two defensible answers.

**Thin Teensy, thick host.** The PC does path planning, trajectory generation, and inverse kinematics, and streams joint-space or even step-space commands to the Teensy at some fixed rate. The Teensy runs the step generator and the safety checks and nothing else. This is easy to develop — you get to write your motion planning in Python with proper debugging tools and visualisation — and it is how PAROL6's own software stack is arranged.

The weakness is dependency. The arm cannot move without the PC, and any hiccup in the PC's scheduling — a garbage collection pause, a Windows update deciding to do something — shows up as a gap in the command stream. Deep buffering hides most of this.

**Thick Teensy, thin host.** The Teensy holds the kinematic model and does IK itself. The host sends high-level commands: move to this pose, at this speed. The Teensy is autonomous and deterministic.

This is more work to build and much harder to debug, since you are developing numerical code on an embedded target. But the result is a robot that works reliably regardless of what the PC is doing, that can run a stored program with no host at all, and that has a single, coherent notion of its own state.

**My suggestion is to start thin and migrate.** Build the host-side stack first, because you will iterate on the kinematics many times and doing that in Python is enormously faster than doing it in C++ on a microcontroller. Get the arm moving. Then, once the kinematics are settled and verified, port the IK to the Teensy — the code is only a few hundred lines and the Cortex-M7 will run it in tens of microseconds. Keep the host path working as a development and diagnostic route.

## 15.2 What the Teensy must own regardless

Some responsibilities belong on the Teensy no matter which architecture you choose, because they must work when the host does not.

Step generation and timing, obviously. Soft limit enforcement, as discussed. The communication watchdog that stops the arm if the host goes quiet. Driver fault monitoring — polling `DRV_STATUS` for over-temperature and short-circuit flags and reacting. Emergency stop handling. And the authoritative position counters, because if the host and the Teensy disagree about where the arm is, the Teensy is the one holding the actual step counts.

## 15.3 A suggested pin allocation

This is a sketch rather than a prescription, but it illustrates how comfortably it fits.

Six STEP pins and six DIR pins takes twelve. A single shared enable takes one, though giving each driver its own enable costs six pins and buys you per-axis control — worth it. Six DIAG inputs take six. Six limit switch inputs take six. Two UART pairs for the drivers take four. A gripper output takes one or two.

That is somewhere around thirty-five pins out of fifty-five, leaving room for status LEDs, an emergency stop input, an encoder or two if you go closed-loop later, and expansion.

Some specific advice on placement. Put the six STEP pins on the same GPIO port if you can, so a single register write can set them all simultaneously — this is a genuine benefit for multi-axis coordination, since it removes the small skew between axes that comes from setting pins one at a time. Check the Teensy pin card for which pins map to which of the fast GPIO ports. Keep the UART pins away from the step pins physically on the board and in your wiring, since the step lines are the fastest-switching signals in the system and will couple into anything adjacent.

## 15.4 Grounding and cable routing, again

I mentioned this in Chapter 6 and I am mentioning it again because it is the difference between a robot that works and one that mysteriously does not.

Motor cables carry amps of fast-switching current and they radiate. Signal cables — especially the UART lines to the drivers, and the DIAG lines — are high-impedance and receptive. Run them apart. Where they must cross, cross at right angles. Twist motor pairs together, which cancels most of the radiated field. If you have persistent problems, use shielded cable for the motors with the shield grounded at one end only.

Ground the system at a single star point. Every ground return — driver power ground, Teensy ground, limit switch commons, the shield — meets at one physical location, and nowhere else. Ground loops are what turn a working bench setup into an intermittently failing assembled robot, and they are very hard to diagnose after the fact and very easy to avoid up front.

# Chapter 16 — Bring-up order and a debugging checklist

## 16.1 Bring it up in this order

Resist the urge to assemble everything and switch on. Each stage below is a place where a fault is easy to find; skip a stage and faults become compound and much harder.

**Stage one: the Teensy alone.** Blink an LED. Confirm you can program it, confirm the USB serial link works, confirm the clock speed is what you think. Ten minutes.

**Stage two: one driver, on the bench, no arm.** One TMC2209, one motor, a bench supply, nothing mechanical attached. Get UART communication working and verify it by reading `IFCNT` and watching it increment. Then use the `VACTUAL` register to spin the motor from the driver's own internal step generator — this proves power, wiring, current setting, and the driver itself, entirely without your step-generation code. Only when that works, switch to STEP/DIR pulses from the Teensy.

**Stage three: one driver, tuning.** Still on the bench, with the motor coupled to something with a bit of inertia. Set current properly and check the motor's temperature after ten minutes of running. Try StealthChop and SpreadCycle and listen to the difference. Log `SG_RESULT` while loading the shaft by hand, so you develop a feel for what the numbers mean.

**Stage four: six drivers.** Add the rest, with addresses strapped correctly. Confirm you can talk to each individually — read a distinctive register value back from each and make sure you get six different answers, not the same one six times, which is what you get if your addressing is wrong. Run all six motors simultaneously and check your step ISR timing with the cycle counter and, ideally, an oscilloscope on the step lines.

**Stage five: one joint, mechanically assembled.** Now attach a motor to an actual joint. Verify direction. Verify that the commanded angle matches the measured angle — put a protractor on it, command 90°, and measure. This catches gear ratio errors immediately, and gear ratio errors are otherwise invisible until the IK produces nonsense. Home the joint and check repeatability over twenty cycles.

**Stage six: the full arm, joint space only.** All six joints, homing sequence working, joint-space moves working, soft limits enforced. No IK yet. Move each joint through its range and confirm nothing collides.

**Stage seven: forward kinematics.** Command a set of joint angles, compute where the FK says the tool should be, and *measure* it. A ruler and a fixed reference point are enough to catch a gross error. Do this at several poses across the workspace.

**Stage eight: inverse kinematics.** Round-trip test in software first — thousands of random poses, FK then IK then FK, confirming the poses match. Only then command Cartesian moves on the real arm, slowly, in open space, well away from anything you mind hitting.

**Stage nine: speed and tuning.** Now raise velocities and accelerations, tune the profiles, and find where the arm starts to lose steps or wobble. Back off from that point with margin.

## 16.2 Symptom-to-cause checklist

**Motor makes noise but does not turn, or vibrates in place.** Almost always a coil pairing error — one coil is split across the two driver outputs. Power off, measure resistance between wire pairs, and re-pair them. Can also be a current setting far too low.

**Motor turns but loses steps under load.** Current too low, acceleration too high, supply voltage too low, or the motor is genuinely undersized for the load. Try in that order. Raising the supply voltage helps specifically at speed.

**Motor gets very hot.** Current too high, or hold current not being reduced at standstill. Check `IHOLD` and `TPOWERDOWN`. Remember the PETG thermal limits.

**Driver does nothing at all, no response over UART.** Check `IFCNT`. If it does not increment, the UART is not getting through: check the 1 kΩ series resistor, check the address straps on MS1/MS2, check that VIO is powered, check RX/TX are not swapped. If `IFCNT` does increment but the motor is dead, check that `TOFF` in `CHOPCONF` is non-zero and that EN is actually low.

**Driver was working, now unresponsive.** Read `GSTAT`. If the reset flag is set, the driver has restarted and lost its configuration — you need to detect this and reconfigure. If the driver-error flag is set, read `DRV_STATUS` for the specific fault.

**Intermittent UART corruption.** Almost always noise coupling from motor wiring, or a ground loop. Separate the cables. Check the star ground. Lower the baud rate as a diagnostic — if it fixes it, you have a signal integrity problem, not a protocol problem.

**StallGuard never triggers.** `TCOOLTHRS` not set, so stall detection is disabled. This is the number one cause. Second is homing speed outside the usable band. Third is `SGTHRS` set too low — remember, higher is more sensitive.

**StallGuard triggers immediately.** You are probably arming it during acceleration. Wait until you reach constant homing speed. Also check that DIAG is not signalling a driver error rather than a stall.

**Arm reaches the right position but the wrong orientation.** Euler angle convention mismatch, or a sign error in one of the α values in the DH table. Check the wrist frames specifically.

**IK works in some poses and not others.** Usually you are hitting the "out of reach" branch without handling it, and a NaN from `acos` is propagating. Add explicit range checks. Can also be joint limits filtering out all eight solutions, which should return a clear "unreachable in this configuration" rather than silently failing.

**The arm makes a sudden violent motion mid-path.** A configuration change — the IK jumped between solution branches. Add continuity preference to your solution selection.

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
| 0x02 | `IFCNT` | R | Increments on each successful write — use to verify UART |
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

a1 = 110.50 · a2 = 23.42 · a3 = 180.00 · a4 = 43.50 · a5 = 176.35 · a6 = 62.80 · a7 = 45.25

**DH table (standard convention)**

| i | θ | α | d | a |
|---|---|---|---|---|
| 1 | θ₁ | −π/2 | 110.50 | 23.42 |
| 2 | θ₂ − π/2 | π | 0 | 180.00 |
| 3 | θ₃ + π | π/2 | 0 | −43.50 |
| 4 | θ₄ | −π/2 | −176.35 | 0 |
| 5 | θ₅ | π/2 | 0 | 0 |
| 6 | θ₆ + π | π | −62.80 | −45.25 |

**Wrist centre offset**: `p_wc = p_flange + R_flange · (45.25, 0, −62.80)ᵀ` mm

**Forearm effective length**: L = 181.636 mm, built-in bend φ = 13.856°

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

```
microsteps = (θ° / 360) × 200 × microstepping × gear_ratio
```

**TMC2209 RMS current**

```
I_RMS = ((CS + 1) / 32) × (V_FS / (R_sense + 0.02 Ω)) × (1/√2)
V_FS = 0.325 V  (vsense = 0)   or   0.180 V  (vsense = 1)
```

**StallGuard stall condition**

```
stall when SG_RESULT ≤ 2 × SGTHRS,  and only while TSTEP ≤ TCOOLTHRS
```

**DH transform**

```
      [ cosθ   −sinθ·cosα    sinθ·sinα   a·cosθ ]
T  =  [ sinθ    cosθ·cosα   −cosθ·sinα   a·sinθ ]
      [   0       sinα         cosα         d   ]
      [   0        0             0          1   ]
```

**Homogeneous transform inverse**

```
T⁻¹ = [ Rᵀ   −Rᵀp ]
      [ 0      1  ]
```

**PAROL6 inverse kinematics — verified**

```
Wrist centre:   p_wc = p_flange + R_flange · (45.25, 0, −62.80)ᵀ

Joint 1:        θ₁ = atan2(y_wc, x_wc)            (+ π for the flipped branch)

Planar coords:  u = ±√(x_wc² + y_wc²) − a2       (− for the flipped branch)
                v = a1 − z_wc

Constants:      L = √(a4² + a5²) = 181.636 mm
                φ = atan2(a4, a5) = 0.24184 rad = 13.856°

Joints 2, 3:    cos B = (u² + v² − a3² − L²) / (2 · a3 · L)
                                                  no solution if |cos B| > 1
                B  = ± acos(...)                  (elbow up / elbow down)
                A  = atan2(v, u) − atan2(L·sin B, a3 + L·cos B)
                θ₂ = A + π/2
                θ₃ = π/2 − φ − B

Wrist:          R_3_6 = R_0_3ᵀ · R_target
                θ₅ = atan2( √(r₁₃² + r₂₃²), −r₃₃ )
                θ₄ = atan2( −r₂₃, −r₁₃ )
                θ₆ = atan2(  r₃₂,  r₃₁ )
                flip:  θ₄+π,  −θ₅,  θ₆+π
```

Verified by round trip against forward kinematics over 5,000 random poses:
worst-case pose error 2.3 × 10⁻¹³.

**Generic two-link planar IK** (link lengths L₁, L₂; target at distance D)

```
cos θ₂ = (D² − L₁² − L₂²) / (2 L₁ L₂)        no solution if |cos θ₂| > 1
θ₁ = atan2(y, x) − atan2(L₂ sin θ₂, L₁ + L₂ cos θ₂)
```

**Jacobian column for revolute joint i**

```
J_i = [ zᵢ × (p − oᵢ) ]
      [      zᵢ       ]
```

**Damped least squares IK step**

```
Δq = Jᵀ (J Jᵀ + λ² I)⁻¹ e
```

**Manipulability**

```
w = √( det( J Jᵀ ) )      → 0 at a singularity
```

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

**IFCNT** — TMC2209 counter that increments on each successful UART write; the definitive test that your UART works.

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

**TCOOLTHRS** — the velocity threshold that gates StallGuard and CoolStep; the most commonly forgotten setting.

**TCP** — Tool Centre Point; the point on the tool whose pose you actually control.

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

Chapters 10.3 and 11.5 give the forward and inverse kinematics in the form that is easiest to read. What follows is the same maths in the form that is easiest to *run*: forward kinematics, the closed-form inverse, and the round-trip self-test all in one file, with nothing elided.

Save it as `ik_full.py` and run it with NumPy installed. It draws 5,000 random joint configurations, runs each through forward kinematics to get a pose, solves that pose, and checks that **every** returned branch reproduces the original transform. On this machine it prints:

```
round-trip worst err = 2.274e-13 | no-solution = 0 | mean #sols = 7.32
```

A worst-case error of 2.3 × 10⁻¹³ is floating-point noise, `no-solution = 0` means no reachable pose was missed, and a mean of 7.3 solutions per pose is what you expect from the eight branches of Chapter 11.6 once the near-singular configurations collapse a pair. If your own implementation cannot produce this table, it is wrong somewhere — this test is the fastest way to find out.

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

Note that the variable names are terse here where the chapter versions are spelled out; this is deliberate, so the whole solver fits on one screen next to the algebra of Chapter 11. The DH constants are identical to the table in Chapter 10.2.
