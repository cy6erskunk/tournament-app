// Hack to normalize Kyselys own "Column Type" id to a number
type NormalizedId<T> = Omit<T, "id"> & {id: number}

export default NormalizedId
