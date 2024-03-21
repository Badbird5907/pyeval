export type Config = {
    autoRun: boolean;
    errorHighlighting: boolean;
    aggressiveErrorHighlighting: boolean;
    customTheme: 'light' | 'dark';
    layout: 'horizontal' | 'vertical';
}
export const defaultConfig: Config = {
    autoRun: true,
    errorHighlighting: true,
    aggressiveErrorHighlighting: true,
    customTheme: 'dark',
    layout: 'horizontal'
}