---
title: Flattening the "Pyramid of Doom" in Swift with Custom Operators
comment-id: 1
gist-id: 799521f251119ce8bbdf832a1ca1dbb8
---

__Update__: The solution in this post is effectively obsoleted by the `guard` statement available since Swift 2.

Swift 1.2 introduces a feature that allows us to condense nested `if` statements into a single one, eliminating the so-called "[pyramid of doom][1]". However, there are still a few edge cases not covered by such an improvement, one of which appears in the [Tiny Networking][2] library by Chris Eidhof:

{% include gist.html id="26bda788f13b3e8a279c" file="tiny-networking.swift" lines="42-60" %}

What prevents us from using a single `if` statement is the fact that there is a corresponding `else` after each `if`. In fact, this is a very common pattern in data serialisation and error handling, so we need a more elegant way to represent it.

<!-- excerpt -->

### Solution

We start out by defining an operator:

{% include gist.html file="pyramid-of-doom-1.swift" %}

The `rhs` parameter of this operator is a closure that acts exactly like an `else` block---it will only be executed if `lhs` is `nil`. Here is an example:

{% include gist.html file="pyramid-of-doom-2.swift" %}

The operator we defined, having higher precedence than the assignment operator, will be evaluated before assignment takes place. The implementation first checks `lhs` to decide whether the closure should be called or not. In the above example, the first string is unwrapped successfully, so its corresponding closure is not called. However, the second string is `nil`, which triggers the execution of its accompanying closure and causes the entire condition to fail.

Similarly, we can overload this operator to handle Boolean values:

{% include gist.html file="pyramid-of-doom-3.swift" %}

We can even add the `@autoclosure` attribute to the `rhs` parameter so that you can pass in an expression without explicit curly braces around it:

{% include gist.html file="pyramid-of-doom-4.swift" %}

Equipped with the new operator, we can now rewrite the code at the beginning of this article as follows. Note that you can chain expressions together with the operator to avoid using any curly braces, as shown in the `where` clause below:

{% include gist.html file="pyramid-of-doom-5.swift" %}

As you can see, by defining a simple operator, we can completely flatten the "pyramid of doom" and make our code much more readable.

[1]:	https://en.wikipedia.org/wiki/Pyramid_of_doom_(programming)
[2]:	https://chris.eidhof.nl/post/tiny-networking-in-swift/
