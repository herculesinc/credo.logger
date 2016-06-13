// DURATION CALCULATOR
// ================================================================================================
export function since(start: number[]) {
    const diff = process.hrtime(start);
    return (diff[0] * 1000 + Math.round(diff[1] / 1000) / 1000);
}