import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Users } from 'lucide-react';

export default function TeamPerformanceChart({ data }) {
  return (
    <Card className="glass-effect border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          عملکرد تیم‌ها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis type="number" fontSize={12} tick={{ fill: '#64748b' }} />
            <YAxis type="category" dataKey="teamName" fontSize={12} tick={{ fill: '#64748b' }} width={80} />
            <Tooltip contentStyle={{ borderRadius: '8px', direction: 'rtl', fontFamily: 'Vazirmatn' }} cursor={{ fill: 'rgba(238, 242, 255, 0.5)' }} />
            <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '14px' }} />
            <Bar dataKey="completed" name="کارهای تکمیل شده" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
            <Bar dataKey="total" name="کل کارها" fill="#a78bfa" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}