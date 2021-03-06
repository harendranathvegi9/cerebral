# Actions

A signal runs actions and actions are actually just functions.

```js
function iAmAnAction () {}
```

That means you do not need any API to define an action. This makes actions highly testable.

Typically you use actions to change the state of the application or run other side effects.

```js
function iAmAnAction ({props, state}) {
  state.set('some.path', props.someValue)
}
```

```js
function iAmAnAction ({http, path}) {
  return http.get('/someitems')
    .then(path.success)
    .catch(path.error)
}
```

## Update props
You update the props on the signal by returning an object form the action. This object will be merged with existing props.

```js
function iAmAnAction () {
  return {
    newProp: 'someValue'
  }
}
```

## Async
When actions return a promise the signal will hold execution until it is resolved. any resolved values will be merged in with props.

```js
function iAmAnAction () {
  return new Promise((resolve) => {
    resolve({
      newProp: 'someValue'
    })
  })
}
```

## Tutorial

**Before you start,** [load this BIN on Webpackbin](https://webpackbin-prod.firebaseapp.com//bins/-KdBPZwKFDQKkAcUqRte)

Signals can take a props-object which can then be accessed or processed by any subsequent action.

Let us say you have a user input which should get written to state.
As we now know, the correct way to write any state change is to use **signals** with **actions**.

Just like we are able to grab the **state** from the context of an action, we can also grab the **props**. This props object can be populated when a signal triggers and it can be further extended using actions. Any object returned from an action will be merged into the current props and passed to the next action.

### Create an action
Let us create a new action that will take a prop from the signal and add some exclamation marks.

```js
function shoutIt ({props}) {
  return {
    message: `${props.message}!!!`
  }
}
```

As you can see we grabbed the props just like we grabbed the state. The object we return from the action will be merged with the existing props. That means we are overriding the **message** with exclamation marks.

On our first **set** operator we rather now use a tag, *props*, to define that we want to set the message from the props.

```js
...
import {set, wait} from 'cerebral/operators'
import {state, props} from 'cerebral/tags'
...
{
  buttonClicked: [
    shoutIt,
    set(state`toast`, props`message`),
    wait(4000),
    set(state`toast`, null)
  ]  
}
```

### Passing a payload
Now we just need to change our button click to actually pass a message:

*App.js*
```js
import React from 'react'
import {connect} from 'cerebral/react'
import {state, signal} from 'cerebral/tags'
import Toast from './Toast'

export default connect({
  title: state`title`,
  subTitle: state`subTitle`,
  buttonClicked: signal`buttonClicked`
},
  function App ({title, subTitle, buttonClicked}) {
    return (
      <div>
        <h1>{title}</h1>
        <h3>{subTitle}</h3>
        <button onClick={() => buttonClicked({
          message: 'Please shout me'
        })}>
          Update state
        </button>
        <Toast />
      </div>
    )
  }
)
```

Now we are ready to test drive our changes. Click the button and you should see the toast message appear with three exclamation marks behind. Take some time to open up the **debugger** and explore the changes you've made. You can track the flow of the props object as it is passed into the action *Input:{}* and after the action has excecuted *Output: {}*. Keep in mind that the object returned from an action will be merged with the props object and handed over to the next action. You could just as easily use a different property for the shouted message.

### Challenge

- Add another custom action which transforms the props value to Uppercase. You may override existing properties on the props or create a new one

If it did not work try jumping to the next chapter or [shout at us on Discord](https://discord.gg/0kIweV4bd2bwwsvH).
