---
title: Asynchronous Image Downloading with Caching in Swift
comment-id: 2
gist-id: 71d9be43c972a9e4baeba2e0e0b2eea8
---

Downloading images asynchronously is [hard][1] due to complexities involving concurrency, speed, and user experience. In this post, I will implement a simple yet effective image downloader with memory and disk caches.

<!-- excerpt -->

### Structure of the Class

The downloader consists of a class named `ImageDownloader`. It provides a method that asynchronously downloads an image with a given URL and calls a handler when the task is completed. Under the hood, this class is also responsible for scheduling incoming download tasks and caching downloaded images.

{% include gist.html lines="1,3,61,82,83" %}

The rest of this post will be organised into three parts, each dealing with one important feature of the downloader.

1.	[Memory and disk caching](#memory-and-disk-caching)
2.	[LIFO task scheduling](#lifo-task-scheduling)
3.	[Duplicate requests coalescing](#duplicate-requests-coalescing)

### Memory and Disk Caching

For simplicity, the downloader uses the `NSURLCache` class provided by Apple. During initialisation, we create the cache with the specified memory and disk capacities (in bytes). We then assign it to an `NSURLSessionConfiguration` object with which we create a custom `NSURLSession` object.

{% include gist.html lines="19-31" %}

Note that we set the `requestCachePolicy` of the configuration object to `.ReturnCacheDataElseLoad`. This enables more aggressive caching and is optional.

From now on, whenever you start a data task using this custom `NSURLSession` object, the response will be cached if it meets the conditions outlined in the [documentation][2].

### LIFO Task Scheduling

By default, network tasks are treated in a FIFO fashion---earlier requests get processed first. LIFO scheduling, however, gives the latest request the highest priority. Why do we need such a behaviour?

Imaging an app that displays rows of images downloaded from the Internet. As the user scrolls down, more and more images are fetched from the server to populate the rows. Assume that the app initially displays rows 1 to 5, and the user quickly scrolls to rows 15 to 20. With FIFO task scheduling, the app has to finish downloading the first five rows of images before it can move on to what the user most urgently wants, causing high latency. LIFO task scheduling solves this problem: the images that are immediately visible to the user are always downloaded first, delivering a responsive experience.

Of course, the scheduler itself needs to be efficient, and the key to this is the data structure we choose to store the tasks. Referring our needs, we know that it should have the following characteristics:

1.	Ordered
2.	Fast insertion
3.	Fast removal
4.	Fast lookup

Dictionaries and sets are ruled out instantly, because they are unordered collections. Neither can we use arrays, because arbitrary lookup and removals run at `O(n)`. The obscure `NSMutableOrderedSet` seems like a good candidate---it is a hybrid between a set and an array, providing the best of both worlds. Of course, these benefits come at the cost of higher memory usage, but it should rarely be a concern nowadays.

Let's create an `NSMutableOrderedSet` instance and add it as a property.

{% include gist.html lines="12" %}

We also need a counter to keep track of the number of active tasks.

{% include gist.html lines="13" %}

Since these variables will be mutated on multiple threads, a lock is used for protection.

{% include gist.html lines="10" %}

Here comes the complicated part. To ensure that the scheduler works correctly, we have to state the invariants in our data structure:

1.	`dataTasks[0..<activeDataTaskCount]` are tasks that are actively running. The rest of the tasks are in a suspended state.
2.	`activeDataTaskCount` falls in the range `0...min(dataTasks.count, maxActiveDataTaskCount)` and should be kept as large as possible within this range.

To achieve LIFO behaviour, new data tasks should be inserted at index 0. After insertion, we also have to increment `activeDataTaskCount`.

{% include gist.html lines="33-36" %}

Then we run a loop to trim down the number of active tasks so that the invariants are kept.

{% include gist.html lines="37-41" %}

Removing a task is a bit trickier. Since we do not know whether the task we are about to remove is active or not, a check must be performed. If the task is active, we have to decrement `activeDataTaskCount` before removing it.

{% include gist.html lines="43-47" %}

Then we run a loop to ensure that `activeDataTaskCount` is as large as possible.

{% include gist.html lines="48-52" %}

Voila! This is all you need to implement a LIFO task scheduler.

### Duplicate Requests Coalescing

Returning to our hypothetical app, an astute reader may discover that if the user scrolls back up while the images there are still loading, duplicate network requests for the same URL will be issued, generating unnecessary traffic. Hence we need a way to detect such requests and combine them with the original one.

But this coalescing behaviour violates our LIFO rule: if a new, duplicate request is combined into an old one, it will not gain the highest priority! A direct way to solve this is to "promote" the data task to the front of the queue.

{% include gist.html lines="54-59" %}

In order to reduce overhead, however, the above implementation deviates from the prescribed behaviour in that it does nothing if the task is already actively running.

Back to the issue. When talking about combining network requests, what we really mean is the ability to modify the completion handler of a data task on the fly. We can achieve this by adding another level of indirection---a helper struct `ResponseHandler` that stores a data task and all the completion handlers it is going to execute upon completion.

{% include gist.html lines="5-8" %}

We also need another property in `ImageDownloader` that maps a URL to a `ResponseHandler`.

{% include gist.html lines="14" %}

Upon receiving a new request, check the `responseHandlers` dictionary first to find out whether this is a duplicate request. If yes, simply extract the `ResponseHandler` instance, promote the data task, and append the completion handler.

{% include gist.html lines="61-67" %}

Otherwise, we need to create a new data task. In its completion handler, extract the dictionary entry for the URL, remove the task from the queue, and execute all the completion handlers.

{% include gist.html lines="68-76" %}

Lastly, do not forget to enqueue the data task and set the dictionary entry for the URL.

{% include gist.html lines="77-82" %}

And here ends the entire implementation of `ImageDownloader`.

### Conclusion

Admittedly, `ImageDownloader` has several limitations such as the inability to cancel a request. Nevertheless, we can still see that implementing asynchronous image downloading is, at least on a conceptual level, a fun exercise.

[1]:	https://www.natashatherobot.com/how-to-download-images-asynchronously-and-make-your-uitableview-scroll-fast-in-ios/
[2]:	https://developer.apple.com/reference/foundation/urlsessiondatadelegate/1411612-urlsession
