import type { Metadata } from 'next';
import Teacher from '../../src/Teacher';
export const metadata: Metadata = { title: 'Lehrkräfte-Übersicht · Schachlabor' };
export default function Page() { return <Teacher />; }
