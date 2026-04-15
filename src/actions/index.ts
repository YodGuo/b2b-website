import { defineAction } from 'astro:actions';
import { inquiry } from './inquiry';
import { comment } from './comment';

export const server = {
  inquiry,
  comment
};
