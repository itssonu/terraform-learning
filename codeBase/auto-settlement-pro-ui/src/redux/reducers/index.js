import { combineReducers } from 'redux';
import users from './users';
import liability from './liabilty';
import injuryData from './injuryData';
import damageData from './damageData';
import subscription from './subscription';
import PreProcessMedicalRecords from './preProccessedMedicalRecords';
import IsCaseSaved from './isCaseSaved'
import routeName from './routeName';
import FormikRefCapture from './formikRefCapture';
import CancelCaseSubmission from './cancelCaseSubmission';
import caseInformation from './caseInformation';
import painAndSuffering from './painAndSuffering';
import medicalProviderData from './medicalProviderData';
import economicDamage from './economicDamage';

const rootReducer = combineReducers({
  users: users,
  liability: liability,
  injuryData: injuryData,
  damageData: damageData,
  subscription: subscription,
  preProcessMedicalRecords: PreProcessMedicalRecords,
  isCaseSaved: IsCaseSaved,
  routeName: routeName,
  formikRefCapture: FormikRefCapture,
  CancelCaseSubmission: CancelCaseSubmission,
  caseInformation: caseInformation,
  painAndSuffering: painAndSuffering,
  medicalProviderData: medicalProviderData,
  economicDamage: economicDamage,
  changeAddCaseFormStep: FormikRefCapture
});

export default rootReducer;