import Tag from './tags/Tag'
import {Compute} from './Compute'

export function getChangedProps (propsA, propsB) {
  const propsAKeys = Object.keys(propsA)
  const propsBKeys = Object.keys(propsB)
  const changedProps = []

  for (let i = 0; i < propsAKeys.length; i++) {
    if (propsA[propsAKeys[i]] !== propsB[propsAKeys[i]]) {
      changedProps.push({path: [propsAKeys[i]]})
    }
  }

  for (let i = 0; i < propsBKeys.length; i++) {
    if (propsA[propsBKeys[i]] !== propsB[propsBKeys[i]]) {
      changedProps.push({path: [propsBKeys[i]]})
    }
  }

  return changedProps
}

export function cleanPath (path) {
  return typeof path === 'string' ? path.replace(/\.\*\*|\.\*/, '') : path
}

export function isObject (obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export function isComplexObject (obj) {
  return typeof obj === 'object' && obj !== null
}

export function isSerializable (value, additionalTypes = []) {
  const validType = additionalTypes.reduce((currentValid, type) => {
    if (currentValid || value instanceof type) {
      return true
    }

    return currentValid
  }, false)

  if (
    value !== undefined &&
    (
      validType ||
      (
        isObject(value) &&
        Object.prototype.toString.call(value) === '[object Object]' &&
        value.constructor === Object
      ) ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'boolean' ||
      value === null ||
      Array.isArray(value)
    )
  ) {
    return true
  }
  return false
}

export function ensurePath (path = []) {
  if (Array.isArray(path)) {
    return path
  } else if (typeof path === 'string') {
    return path.split('.')
  }

  return []
}

export function throwError (message) {
  throw new Error(`Cerebral - ${message}`)
}

export function isDeveloping () {
  return process.env.NODE_ENV !== 'production'
}

export function isDebuggerEnv () {
  return !(
    (
      typeof window === 'undefined'
    ) ||
    (
      typeof window.chrome === 'undefined' &&
      !process && !process.versions && !process.versions.electron
    )
  )
}

export function delay (func, wait) {
  return function (...args) {
    const context = this
    const later = () => {
      func.apply(context, args)
    }

    setTimeout(later, wait)
  }
}

export function forceSerializable (value) {
  if (value && !isSerializable(value)) {
    const name = value.constructor.name

    try {
      Object.defineProperty(value, 'toJSON', {
        value () {
          return `[${name}]`
        }
      })
    } catch (e) {}
  }

  return value
}

export function getProviders (module) {
  return (module.provider ? [module.provider] : []).concat(Object.keys(module.modules || {})
    .reduce((nestedProviders, moduleKey) => {
      return nestedProviders.concat(getProviders(module.modules[moduleKey]))
    }, [])
  )
}

function extractAllChildMatches (children) {
  return Object.keys(children).reduce((matches, key) => {
    if (children[key].children) {
      return matches.concat(children[key]).concat(extractAllChildMatches(children[key].children))
    }

    return matches.concat(children[key])
  }, [])
}

export function dependencyMatch (changes, dependencyMap) {
  let currentMatches = []

  for (let changeIndex = 0; changeIndex < changes.length; changeIndex++) {
    let currentDependencyMapLevel = dependencyMap
    for (let pathKeyIndex = 0; pathKeyIndex < changes[changeIndex].path.length; pathKeyIndex++) {
      if (!currentDependencyMapLevel) {
        break
      }

      if (currentDependencyMapLevel['**']) {
        currentMatches.push(currentDependencyMapLevel['**'])
      }

      if (pathKeyIndex === changes[changeIndex].path.length - 1) {
        const dependency = currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]]
        if (dependency) {
          currentMatches.push(dependency)

          if (dependency.children) {
            if (changes[changeIndex].forceChildPathUpdates) {
              currentMatches = currentMatches.concat(extractAllChildMatches(dependency.children))
            } else {
              if (dependency.children['**']) {
                currentMatches.push(dependency.children['**'])
              }

              if (dependency.children['*']) {
                currentMatches.push(dependency.children['*'])
              }
            }
          }
        }

        if (currentDependencyMapLevel['*']) {
          currentMatches.push(currentDependencyMapLevel['*'])
        }
      }

      if (!currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]]) {
        currentDependencyMapLevel = null
        break
      }

      currentDependencyMapLevel = currentDependencyMapLevel[changes[changeIndex].path[pathKeyIndex]].children
    }
  }

  return currentMatches
}

export function getWithPath (obj) {
  return (path) => {
    return path.split('.').reduce((currentValue, key, index) => {
      if (index > 0 && currentValue === undefined) {
        throwError(`You are extracting with path "${path}", but it is not valid for this object`)
      }

      return currentValue[key]
    }, obj)
  }
}

export function ensureStrictPath (path, value) {
  if (isComplexObject(value) && path.indexOf('*') === -1) {
    return `${path}.**`
  }

  return path
}

export function createResolver (getters) {
  return {
    isTag (arg, ...types) {
      if (!(arg instanceof Tag)) {
        return false
      }

      if (types.length) {
        return types.reduce((isType, type) => {
          return isType || type === arg.type
        }, false)
      }

      return true
    },
    isCompute (arg) {
      return arg instanceof Compute
    },
    value (arg, overrideProps) {
      if (arg instanceof Tag || arg instanceof Compute) {
        return arg.getValue(overrideProps ? Object.assign({}, getters, {props: overrideProps}) : getters)
      }

      return arg
    },
    path (arg) {
      if (arg instanceof Tag) {
        return arg.getPath(getters)
      }

      throwError('You are extracting a path from an argument that is not a Tag')
    }
  }
}

export const noop = () => {}
