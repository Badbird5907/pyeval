export type Config = {
    autoRun: boolean;
    enableKeyboard: boolean;
    errorHighlighting: boolean;
    aggressiveErrorHighlighting: boolean;
    tabSpaces: number;
    customTheme: 'light' | 'dark';
    useFallbackEditor: boolean;
}
export const defaultConfig: Config = {
    autoRun: true,
    enableKeyboard: false,
    errorHighlighting: true,
    aggressiveErrorHighlighting: true,
    tabSpaces: 4,
    customTheme: 'dark',
    useFallbackEditor: false
}