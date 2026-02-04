export function getOrderLimits() {
  const minEnv = Number(process.env.NEXT_PUBLIC_ORDER_MIN_QTY)
  const maxEnv = Number(process.env.NEXT_PUBLIC_ORDER_MAX_QTY)
  const min = Number.isFinite(minEnv) && minEnv >= 1 ? minEnv : 1
  const max = Number.isFinite(maxEnv) && maxEnv >= min ? maxEnv : 250000
  return { min, max }
}
