const DEFAULT_STATE = {
  formData: []
}

const setMyItems = (state, action) => {
  let newFormData = state.formData.slice(0)
  let needNewItemArray = true;

  for (let field of newFormData) {
    if (field.id == action.payload.id) {
      field.items = field.items.concat(action.payload.items)
      needNewItemArray = false;
      break;
    }
  }

  if (needNewItemArray) {
      newFormData.push(action.payload)
  }
  console.log("formdata", newFormData)
  return {formData: newFormData}
}

const literal = (state=DEFAULT_STATE, action) => {
  switch(action.type) {
    case 'SET_ITEMS':
      return setMyItems(state,action)
    default:
      return state
  }
}

export default literal