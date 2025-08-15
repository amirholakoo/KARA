import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function TaskTrendsChart({ data }) {
  return (
    <Card className="glass-effect border-none shadow-lg h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          روند ایجاد و تکمیل کارها
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
            <XAxis dataKey="date" fontSize={12} tick={{ fill: '#64748b' }} />
            <YAxis fontSize={12} tick={{ fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', direction: 'rtl', fontFamily: 'Vazirmatn' }} />
            <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '14px' }} />
            <Area type="monotone" dataKey="created" name="ایجاد شده" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCreated)" />
            <Area type="monotone" dataKey="completed" name="تکمیل شده" stroke="#16a34a" fillOpacity={1} fill="url(#colorCompleted)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}