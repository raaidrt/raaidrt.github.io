---
title: "Hello World"
description: "Welcome to my blog. A place where I share thoughts on math, programming, and economics."
date: 2024-12-24
---

Welcome to my blog!

I'm excited to write about math, programming, and economics.

This blog supports writing math through [KaTeX](https://katex.org/) and rendering diagrams through [Mermaid](https://mermaid.js.org/), as shown below through Green's Theorem
```latex
\oint_C (L \, dx + M \, dy) = \iint_D \left( \frac{\partial M}{\partial x} - \frac{\partial L}{\partial y} \right) dA
```
$$
\oint_C (L \\, dx + M \\, dy) = \iint_D \left( \frac{\partial M}{\partial x} - \frac{\partial L}{\partial y} \right) dA
$$

And below is a deterministic finite automaton that recognizes the regular expression `(hello\s)+world`.
<pre class="mermaid">
flowchart LR
    start[ ] -->|" "| q0
    q0(("$$q_0$$")) -->|h| q1(("$$q_1$$"))
    q1 -->|e| q2(("$$q_2$$"))
    q2 -->|l| q3(("$$q_3$$"))
    q3 -->|l| q4(("$$q_4$$"))
    q4 -->|o| q5(("$$q_5$$"))
    q5 -->|␣| q6(("$$q_6$$"))
    q6 -->|h| q1
    q6 -->|w| q7(("$$q_7$$"))
    q7 -->|o| q8(("$$q_8$$"))
    q8 -->|r| q9(("$$q_9$$"))
    q9 -->|l| q10(("$$q_{10}$$"))
    q10 -->|d| q11(("$$q_{11}$$"))

    style start fill:none,stroke:none
    style q11 stroke-width:4px
</pre>
