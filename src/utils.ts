export type Values<T> = T[keyof T]

export type UnionToIntersection<U> = (
	U extends unknown ? (arg: U) => void : never
) extends (arg: infer I) => void
	? I
	: never
