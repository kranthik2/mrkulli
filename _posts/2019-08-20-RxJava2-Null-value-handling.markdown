---
layout: post
title:  "RxJava2 NullPointerException handling"
date:   2019-08-20 
categories: [RxJava]
---

Current Reactive streams specification does not accept null as a stream element since RxJava2 built on top of it which will produce NullPointerException for the null return value.

Sample null return example:

{% highlight java %}
    public static void main(String[] args) {
        Observable.fromCallable(() -> null)
                .doOnError(System.out::println)
                .subscribe(System.out::println);
    }
{% endhighlight %}


{% highlight log %}
Caused by: java.lang.NullPointerException: Callable returned null
{% endhighlight %}

RxJava2 not allowing null as stream value created chaos in Java (JVM) community and people are fighting over why it is not allowed. See [ https://github.com/ReactiveX/RxJava/issues/4644 ](https://github.com/ReactiveX/RxJava/issues/4644), as always rules get changed by need and time until reactive stream specifications get amended, we need to use workarounds to handle NullPointerException from RxJava2.


**How to handle NullPointerException**

There are multiple ways to handle null return like using Optional, wrapping return value in an Observable<Optional<T>> is an unnecessary complication and you end up cluttering your application or API by Observable<Optional<SomeObject>> where we could just use Observable<SomeObject>. Below solution uses ***onErrorResumeNext*** to handle null returns than using Optional. onErrorResumeNext instructs a reactive type to emit a sequence of items if it encounters an error.

{% highlight java %}
        Observable.fromCallable(() -> null)
                .doOnError(System.out::println).onErrorResumeNext(throwable -> {
            if (throwable instanceof NullPointerException) {
                return Observable.just("returning data not found");
            }
            //returns exceptions
            return Observable.just(throwable);
        }).subscribe(System.out::println);
{% endhighlight %}


{% highlight log %}
java.lang.NullPointerException: Callable returned null
returning data not found
{% endhighlight %}