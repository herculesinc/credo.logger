// SEVERITY LEVEL
// ================================================================================================
export enum SeverityLevel { debug = 1, info, warning, error }
export namespace SeverityLevel {
    export function parse(value: SeverityLevel | string): SeverityLevel {
        if (!value) return;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return SeverityLevel[value];
    }
}

// COLOR
// ================================================================================================
export type Color = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'grey';
export const Color = {
    black       : 'black' as Color,
    red         : 'red' as Color,
    green       : 'green' as Color,
    yellow      : 'yellow' as Color,
    blue        : 'blue' as Color,
    magenta     : 'magenta' as Color,
    cyan        : 'cyan' as Color,
    white       : 'white' as Color,
    grey        : 'grey' as Color
};