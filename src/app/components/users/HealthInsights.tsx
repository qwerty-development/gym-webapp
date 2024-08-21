//app/users/HealthInsights.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ChatBox from './ChatBox';


interface HealthInsightsProps {
  userData: any;
}

const HealthInsights: React.FC<HealthInsightsProps> = ({ userData }) => {
  const [isChatOpen, setIsChatOpen] = useState(true);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getWHRRisk = (whr: number, gender: string) => {
    if (gender === 'male') {
      if (whr <= 0.5) return 'Low';
      if (whr <= 0.57) return 'Moderate';
      return 'High';
    } else if (gender === 'female') {
      if (whr <= 0.49) return 'Low';
      if (whr <= 0.54) return 'Moderate';
      return 'High';
    }
    return 'Unknown';
  };



  const latestWeight =
    userData.weight && userData.weight.length > 0
      ? userData.weight[userData.weight.length - 1].value
      : null;

  const latestWaist =
    userData.waist_circumference && userData.waist_circumference.length > 0
      ? userData.waist_circumference[userData.waist_circumference.length - 1]
          .value
      : null;

  const bmi =
    latestWeight && userData.height
      ? (latestWeight / Math.pow(userData.height / 100, 2)).toFixed(2)
      : 'N/A';

  const whr =
    latestWaist && userData.height
      ? (latestWaist / userData.height).toFixed(2)
      : 'N/A';

  const bmiCategory =
    bmi !== 'N/A' ? getBMICategory(parseFloat(bmi)) : 'Unknown';
  const whrRisk =
    whr !== 'N/A' && userData.gender
      ? getWHRRisk(parseFloat(whr), userData.gender)
      : 'Unknown';


  return (
    <div className='bg-gray-800 rounded-lg shadow-lg p-6 text-white'>
      <h3 className='text-2xl font-bold mb-6 text-green-400'>Health Insights</h3>
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8'>
        <motion.div
          className='bg-gray-700 rounded-lg p-4'
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}>
          <h4 className='text-lg font-semibold mb-2'>BMI Category</h4>
          <p className='text-2xl font-bold text-green-400'>{bmiCategory}</p>
        </motion.div>
        <motion.div
          className='bg-gray-700 rounded-lg p-4'
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}>
          <h4 className='text-lg font-semibold mb-2'>Waist-to-Height Ratio Risk</h4>
          <p className='text-2xl font-bold text-green-400'>{whrRisk}</p>
        </motion.div>
      </div>

      {/* Chat Box Section */}
      <div className='mb-8'>
        <h4 className='text-2xl font-bold mb-6 text-green-400'>Ask Vista for Advice</h4>
        <ChatBox userData={userData} />
      </div>
    </div>
  );
};

export default HealthInsights;
