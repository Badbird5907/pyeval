export type Config = {
    autoRun: boolean;
    errorHighlighting: boolean;
    aggressiveErrorHighlighting: boolean;
    layout: 'horizontal' | 'vertical';
}
export const defaultConfig: Config = {
    autoRun: true,
    errorHighlighting: true,
    aggressiveErrorHighlighting: true,
    layout: 'horizontal'
}