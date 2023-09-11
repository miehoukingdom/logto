import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import Card from '@/ds-components/Card';
import FormField from '@/ds-components/FormField';
import Switch from '@/ds-components/Switch';

import type { SignInExperienceForm } from '../../types';
import * as styles from '../index.module.scss';

function AuthenticationForm() {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });
  const { register } = useFormContext<SignInExperienceForm>();

  return (
    <Card>
      <div className={styles.title}>{t('sign_in_exp.content.advanced_options.title')}</div>
      <FormField title="sign_in_exp.content.advanced_options.enable_user_registration">
        <Switch
          {...register('createAccountEnabled')}
          label={t('sign_in_exp.content.advanced_options.enable_user_registration_description')}
        />
      </FormField>
    </Card>
  );
}

export default AuthenticationForm;