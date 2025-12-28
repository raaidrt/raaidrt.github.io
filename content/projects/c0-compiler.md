---
title: C0 Compiler
description: A compiler for the C0 language targeting `x86_64` and LLVM IR, featuring SSA, register allocation via chordal graph coloring, and optimizations competitive with `gcc -O1`.
featured: true
expandable: true
order: 1
---

A fully-featured compiler for the [C0 language](https://c0.cs.cmu.edu/docs/c0-reference.pdf), a safe subset of C used for teaching at CMU. The compiler targets both `x86_64` directly and LLVM IR (enabling compilation to ARM and other architectures). With all optimizations enabled, the compiler achieves an average **1.74x speedup** on benchmark test cases.

## Pipeline Overview

The compiler supports two backends: a native x86-64 backend and an LLVM IR backend for cross-platform compilation.

<pre class="mermaid">
flowchart LR
    subgraph FE[Frontend]
        A[C0 Source] --> B[Lexer]
        B --> C[Parser]
        C --> D[Elaborator]
        D --> E[Type Checker]
    end

    subgraph ME[Middle-end]
        F[IR Translation] --> G{Target?}
        G -->|x86-64| H[IR Opts]
        H --> I[Abstract Assembly]
        G -->|LLVM| J[LLVM IR]
    end

    subgraph BE[x86 Backend]
        K[Asm Opts] --> L[Reg Alloc]
        L --> M[x86-64]
    end

    subgraph LLVM[LLVM Backend]
        N[llc] --> O[x86_64 / ARM / etc.]
    end

    FE --> ME
    I --> BE
    J --> LLVM
</pre>

## Implementation

### Frontend

- **Lexer** with lexer hack for distinguishing type identifiers from regular identifiers
- **Parser** built using Menhir
- **Elaboration** pass for semantic analysis and AST transformation

### Middle-end

- **IR translation** to a lower-level intermediate representation
- **SSA construction** for enabling dataflow optimizations

## Optimizations

The compiler implements optimizations at two layers: the intermediate representation (IR) and abstract assembly.

<pre class="mermaid">
flowchart LR
    subgraph IR[IR Optimizations]
        A[Function Inlining] --> B[Tail Call Opt]
        B --> C[Reachability]
    end

    subgraph SSA[SSA Optimizations]
        D[CCP] --> E[ADCE]
        E --> F[Copy Prop]
        F -.->|repeat| D
    end

    subgraph Loop[Loop Optimizations]
        G[Loop-nest Tree] --> H[Invariant Hoisting]
        H --> I[Alignment]
    end

    subgraph x86[x86 Peephole]
        J[Redundant Moves]
        K[Unnecessary LEA]
        L[Unnecessary JMP]
    end

    IR --> SSA --> Loop --> x86
</pre>

### IR Optimizations

#### Tail Call Optimization

For functions that end in recursive tail calls (not mutual recursion), we remove the tail call and instead move the arguments into the correct argument temps, then jump to a point at the beginning of the function body. This eliminates function calling stack overhead and makes control-flow analysis easier. This optimization was critical for preventing stack overflows in deeply recursive programs.

#### Function Inlining

We perform function inlining for non-recursive calls up to a call depth of 3, only inlining functions with at most 100 lines in the body. For example, if function `f` calls `g`, `g` calls `h`, and `h` calls `i`, we inline `g` into `f`, `h` into `g`, and `i` into `h`, but we don't inline beyond that depth.

Inlining was particularly effective when combined with constant propagation, as it allows constants to propagate across function boundaries. This effectively removed many small arithmetic helper functions entirely.

#### Reachability Analysis

We transform the IR into basic blocks and prune any blocks that are unreachable from the function entry point.

### Abstract Assembly Optimizations

#### Strength Reductions

Standard strength reduction pass replacing expensive operations (like multiplication by powers of two) with cheaper equivalents (like left shifts).

#### Conditional Constant Propagation (CCP)

Adapted from the Appel textbook, this algorithm performs constant propagation while simultaneously pruning branches that would not be taken based on constant values. Combined with function inlining, CCP can propagate constants across function boundaries, enabling significant simplifications.

#### Aggressive Dead Code Elimination (ADCE)

Adapted from the Cooper textbook, this removes branches and instructions within the control flow graph that are not necessary for effectful operations such as returns, memory accesses, or function calls.

#### Loop Invariant Hoisting

Using a Loop-nest tree construction, we identify instructions within loops that can be hoisted to loop preheaders. The algorithm works recursively from the deepest nested loops outward, using hoisted invariants from inner loops when computing invariants for parent loops.

#### Register Coalescing

Using a union-find data structure, we coalesce moves between temps that are not live at the same time. This is a fast single-pass optimization that runs at all optimization levels.

### x86 Optimizations

We eliminate self-move operations (moves of the form `%rax <- %rax`). This optimization became especially valuable after register coalescing, since coalesced temps are assigned the same register, making their original move instructions redundant.

### Backend

- Instruction selection for `x86_64`
- Register allocation via chordal graph coloring
- Peephole optimizations (redundant moves, unnecessary `lea` and `jmp` removal)

## LLVM Backend

The compiler also supports emitting LLVM IR, which can then be compiled via `llc` to target multiple architectures including ARM.

### Safety Checks

To match C0's dynamic semantics in safe mode, we inject control flow checks for:
- Division/modulus by zero
- Division of `INT_MIN` by `-1`
- Shift amounts outside the range `[0, 32)`

These checks raise `SIGFPE` when an illegal operation is attempted.

### SSA Adaptations

LLVM IR requires phi nodes to contain values for every incoming edge to a basic block. We adapted our SSA representation by adding dummy values (0 for integers, null for pointers) on edges where a temp has not yet been defined.

### Performance

When targeting ARM via LLVM on Apple Silicon, native ARM code showed significant speedups over x86-64 code running through Rosetta translation.
