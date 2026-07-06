---
title: "Maximum non-checkmating queens"
description: "Using the z3 solver in Python to find the maximum number of non-checkmating queens that can be placed on a chessboard"
date: 2026-07-05
---

<aside class="callout">
<span class="callout-label">AI Note</span>

AI has not been used for writing any prose in this blogpost. AI has only been 
used to help write the Python code that formulates the z3 constraints, and 
for checking for bugs in my math.

</aside>

A classical question that has been asked in years past is the $n$-queens
problem, which asks what a configuration of $n$ queens on an $n \times n$
chess board is such that no two queens attack each other.

It is always possible, for $n > 3$, to generate a solution to the $n$-queens 
problem.[^1]

The $n$-queens board is not a board that would come up in a real game, since 
there are no black or white kings on the board! A more interesting question to
ask might be:

> Given that there are both white and black kings on the board, 
what is the maximum number of black queens that may be placed on the board 
such that on white's turn, white is not in checkmate and the black king is 
not attacked?

Short of trying all possible configurations of black queens, and the white and 
black kings on the board, there really is no way to try to manually come up 
with a maximal configuration by oneself.

A popular way of modeling integer optimization questions subject to integer 
constraints is by formulating these problems as integer-programming (IP) 
problems. Integer-programming is a problem that is classically known to be 
$\mathbb{NP}$-hard. For small problem sizes, modern SAT solvers should be able 
to employ state-of-the-art SAT solving techniques to breeze through finding 
solutions to IP problems. 

## A short refresher on Integer Programming
Integer programming is a specification of values $m, n \in \mathbb{N}, \mathbf{c} \in \mathbb{R}^n, \mathbf{b} \in \mathbb{R}^m$, and $A \in \mathbb{R}^{m \times n}$. A solution to an integer programming 
problem maximizes $\mathbf{c}^T \mathbf{x}$ where $\mathbf{x} \in \mathbb{Z}^n$ such that the following 
conditions are true 
$$A\mathbf{x} \leq \mathbf{b} \,\,\text{and}\,\, \mathbf{x} \geq \mathbf{0}$$

We will now attempt to provide an integer programming formulation for the problem at hand.

## Variables
We first declare the variables that will be needed for expressing our 
constraints and setting up the function we will eventually try to optimize for. 

Let $S = \{A, ..., H\} \times \{1, ..., 8\}$ be the set of all 64 squares on 
the board. We use the classical (rank, file) notation as we do in chess, where
the bottom left square is called $A1$, and the top right square is called $H8$. 

We first define a set of indicators for queens on the board, for each square 
$s \in S$. 

$$\mathsf{id}_{\text{queen}, s} \in \{0, 1\}$$

Then, we go on to defining indicators for white and black kings on the board, 
for each square $s \in S$.

$$\mathsf{id}_{\text{white king}, s}, \mathsf{id}_{\text{black king}, s} \in \{0, 1\}$$

## Constraints
With only the variables defined above, we may model the constraints that are 
required for us to express the constraints of Chess with respect to Kings, Queens, and 
checks as follows.

### Square Occupancy
There can be at most one piece on a square at any given time, and this constraint 
may be expressed, for each square $s \in S$, as follows.

$$ \mathsf{id}_{\text{queen}, s} + \mathsf{id}_{\text{white king}, s} + \mathsf{id}_{\text{black king}, s} \leq 1 $$

### Kings on the Board
Both the white and black kings should be present on the board, which is a constraint that may be expressed, 
without loss of generality for the black king, as the following.
$$ \sum_{s \in S} \mathsf{id}_{\text{black king}, s} = 1 $$

Repeating the same constraint as above but for white will express the fact that there is one white 
king on the board. 

We must also encode the constraint that the black and white kings do not sit on adjacent squares.
Let $\mathsf{adj} : S \rightarrow \mathcal{P}(S)$ be a function that computes the set of adjacent squares 
for a given square.

We simply require the following constraint for all squares $s \in S$.
$$\mathsf{id}_{\text{white king}, s} = 1 \Longrightarrow \sum_{t \in \mathsf{adj}(s)} \mathsf{id}_{\text{black king}, t} = 0$$

You may take issue with the fact that since the implication is predicated on the value of a 
particular variable, this does not really respect the constraints of an IP problem since 
we do not necessarily have constant coefficients for variables on the left hand side of an inequality (or equality). 

To this, I say that it is possible to reformulate the implication as such 
$$\mathsf{id}_{\text{white king}, s} + \sum_{t \in \mathsf{adj}(s)} \mathsf{id}_{\text{black king}, t} \leq 1$$

If the white king is present on a square, then the neighborhood indicators for the black king must sum to 
zero, which is the implication that we want. If the white king is not present in the square, then we know that 
there can be at most one black king in the neighborhood (or none!) which still passes the inequality. 

### Queen Attacks
To model queen attacks, we need to create some sort of construct to denote the notion of attacking and blocking
attacks. An interesting thing about queens of the same color is that if one queen blocks another queen, even
though the ray of attack is blocked, the blocking queen has its own ray of attack that makes up for the 
blocked rays. Hence, blocking as a concept is only relevant for the black king who can block another black
queen's attack.

Unfortunately, for modeling attacks, it would be very difficult to construct a linear integer programming 
constraint that is succinct (I've also not been able to come up with one in 20 minutes or so of thinking; please reach 
out to me if you come up with a good constraint for modeling attacks!). So, we fallback to expressing 
the constraints in a more expressive theory called SMT ([Satisfiability modulo theories](https://en.wikipedia.org/wiki/Satisfiability_modulo_theories)) that 
allows us to express constraints as the following, for the directions set $D = \{-1, 0, 1\}^2 \setminus \{(0, 0)\}$, and 
for the function $\mathsf{ray} : S \times D \rightarrow \mathcal{P}(S)$ which is a function that returns the ray of squares
from a specified square and in a provided direction:
$$\mathsf{attacks}(s) := \bigvee_{d \in D, t \in \mathsf{ray}(s, d)} \left(\mathsf{id}_{\text{queen}, t} \wedge \left(\bigwedge_{0 < i \lt \|t - s\|} \neg \mathsf{id}_{\text{black king}, s + i \cdot d}\right)\right)$$

To explain in english, $\mathsf{attacks}(s)$ basically denotes whether $s$ is attacked or not. It does so by 
checking the rays emanating from $s$ in all directions $d \in D$, and checks for all cells $t \in \mathsf{ray}(s, d)$ whether 
$t$ has a queen and whether there is a black king on the path from $s$ to $t$ (in which case the ray would be blocked).

### Not in Checkmate
In order to denote the fact that the white king is not in checkmate, we basically check that either 
the king is not in check (which is easy to check with $\neg \mathsf{attacks(s)}$), or that the 
there are escape squares available, which is also easy to check over the neighborhood. 
$$\mathsf{id}_{\text{white king}, s} \Longrightarrow \neg \mathsf{attacks}(s) \vee \neg \bigwedge_{t \in \mathsf{adj}(s)} \mathsf{attacks}(t)$$

This completes the specification of constraints for our problem. We finally need to specify the objective function to maximize over!

## Objective Function
Since the objective is to maximize the number of queens placed, we simply want to maximize the following quantity
$$\sum_{s \in S} \mathsf{id}_{\text{queen}, s}$$

## The 8&times;8 solution

Below is a solution to the 8x8 board, where, even the white king is attacked by both queens on $B7$ and $D8$, 
is able to capture the queen on $D8$ on the next turn and escape all checks. The black king is able to 
block some queens' attacks along two diagonals and the $D$ file.

<script type="module" src="https://unpkg.com/chessboard-element@1.2.0?module"></script>

<figure class="chessboard-figure">
  <chess-board position="2Kq4/qq3qqq/q1qkq1qq/1qqqqq1q/qqqqqqq1/qqqqqqqq/qqqqqqqq/qqqqqqqq" role="img" aria-label="8 by 8 board with 48 black queens, one white king, and one black king; white is not in checkmate"></chess-board>
  <figcaption>The optimal 8&times;8 configuration: 48 black queens with white not in checkmate.</figcaption>
</figure>

## Growth with board size

I was able to plot the maximum number of non-checkmating queens for $n = 4$ all the way up to $n = 11$ ($n = 12$ was taking multiple hours to compute so I gave up). 

<figure class="plot-figure">
  <img src="../max-queens-vs-n.png" alt="Line plot of the maximum number of non-mating black queens against board size n, rising from 8 at n=4 to 99 at n=11.">
  <figcaption>Maximum non-mating black queens as a function of board size.</figcaption>
</figure>

A clear pattern emerges, where the maximum number of non-checkmating queens appears to be $(n - 1)^2 - 1$ for $n = 4$ through $11$. 
It should be possible to come up with a proof of this fact, but alas I couldn't get to it this weekend. 

[^1]: Explicit constructions for all $n \geq 4$ are given in Hoffman, Loessi
    and Moore, ["Constructions for the Solution of the m Queens Problem"](https://ntrs.nasa.gov/api/citations/20200003161/downloads/20200003161.pdf) (1969).


