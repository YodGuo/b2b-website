import { defineAction } from 'astro:actions';

export const test = defineAction({
  accept: 'form',
  handler: async (input, context) => {
    console.log('Test action called');
    console.log('Input:', input);
    console.log('Context:', context);
    
    return { success: true, message: 'Test action executed successfully' };
  }
});