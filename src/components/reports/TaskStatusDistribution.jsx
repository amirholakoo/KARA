import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const COLORS = ['#60a5fa', '#a78bfa', '#4ade80', '#f87171'];

export default function TaskStatusDistribution({ data }) {
  return (
    <Card className="glass-effect border-none shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieIcon className="w-5 h-5 text-green-600" />
          پراکندگی وضعیت کارها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={110}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', direction: 'rtl', fontFamily: 'Vazirmatn' }} />
            <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '14px', paddingTop: '20px' }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}