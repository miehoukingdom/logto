import type { ResourceResponse, Scope, ScopeResponse } from '@logto/schemas';
import { managementApiScopeAll } from '@logto/schemas';
import { conditional } from '@silverhand/essentials';
import classNames from 'classnames';
import type { ChangeEvent } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useSWR from 'swr';

import Search from '@/assets/images/search.svg';
import DataEmpty from '@/components/DataEmpty';
import type { DetailedResourceResponse } from '@/components/RoleScopesTransfer/types';
import TextInput from '@/components/TextInput';
import type { RequestError } from '@/hooks/use-api';
import * as transferLayout from '@/scss/transfer.module.scss';

import ResourceItem from '../ResourceItem';
import * as styles from './index.module.scss';

type Props = {
  roleId?: string;
  selectedScopes: ScopeResponse[];
  onChange: (value: ScopeResponse[]) => void;
};

const SourceScopesBox = ({ roleId, selectedScopes, onChange }: Props) => {
  const { t } = useTranslation(undefined, { keyPrefix: 'admin_console' });

  const { data: allResources, error: fetchAllResourcesError } = useSWR<
    ResourceResponse[],
    RequestError
  >('api/resources?includeScopes=true');

  const { data: roleScopes, error: fetchRoleScopesError } = useSWR<Scope[], RequestError>(
    roleId && `api/roles/${roleId}/scopes`
  );

  const isLoading =
    (!allResources && !fetchAllResourcesError) || (roleId && !roleScopes && !fetchRoleScopesError);

  const hasError = Boolean(fetchAllResourcesError) || Boolean(roleId && fetchRoleScopesError);

  const [keyword, setKeyword] = useState('');

  const handleSearchInput = (event: ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const isScopeAdded = (scope: ScopeResponse) =>
    selectedScopes.findIndex(({ id }) => id === scope.id) >= 0;

  const onSelectScope = (scope: ScopeResponse) => {
    onChange(
      isScopeAdded(scope)
        ? selectedScopes.filter(({ id }) => id !== scope.id)
        : [scope, ...selectedScopes]
    );
  };

  const onSelectResource = ({ scopes: resourceScopes }: DetailedResourceResponse) => {
    const isAllSelected = resourceScopes.every((scope) => isScopeAdded(scope));
    const resourceScopesIds = new Set(resourceScopes.map(({ id }) => id));
    const selectedScopesExcludeResourceScopes = selectedScopes.filter(
      ({ id }) => !resourceScopesIds.has(id)
    );
    onChange(
      isAllSelected
        ? selectedScopesExcludeResourceScopes
        : [...resourceScopes, ...selectedScopesExcludeResourceScopes]
    );
  };

  const getResourceSelectedScopes = ({ scopes }: DetailedResourceResponse) =>
    scopes.filter((scope) => selectedScopes.findIndex(({ id }) => id === scope.id) >= 0);

  const resources: DetailedResourceResponse[] = useMemo(() => {
    if (!allResources || (roleId && !roleScopes)) {
      return [];
    }

    const existingScopeIds = roleScopes?.map(({ id }) => id) ?? [];
    const excludeScopeIds = new Set([...existingScopeIds, managementApiScopeAll]);

    return allResources
      .filter(({ scopes }) => scopes.some(({ id }) => !excludeScopeIds.has(id)))
      .map(({ scopes, ...resource }) => ({
        ...resource,
        scopes: scopes
          .filter(({ id }) => !excludeScopeIds.has(id))
          .map((scope) => ({
            ...scope,
            resource,
          })),
      }));
  }, [allResources, roleId, roleScopes]);

  const dataSource = useMemo(() => {
    const lowerCasedKeyword = keyword.toLowerCase();

    return (
      conditional(
        lowerCasedKeyword &&
          resources
            .filter(({ name, scopes }) => {
              return (
                name.toLowerCase().includes(lowerCasedKeyword) ||
                scopes.some(({ name }) => name.toLowerCase().includes(lowerCasedKeyword))
              );
            })
            .map(({ scopes, ...resource }) => ({
              ...resource,
              scopes: scopes.filter(
                ({ name, resource }) =>
                  name.toLocaleLowerCase().includes(lowerCasedKeyword) ||
                  resource.name.toLocaleLowerCase().includes(lowerCasedKeyword)
              ),
            }))
            .filter(({ scopes }) => scopes.length > 0)
      ) ?? resources
    );
  }, [keyword, resources]);

  const isEmpty = !isLoading && !hasError && dataSource.length === 0;

  return (
    <div className={transferLayout.box}>
      <div className={transferLayout.boxTopBar}>
        <TextInput
          className={styles.search}
          icon={<Search className={styles.icon} />}
          placeholder={t('general.search_placeholder')}
          onChange={handleSearchInput}
        />
      </div>
      <div
        className={classNames(transferLayout.boxContent, isEmpty && transferLayout.emptyBoxContent)}
      >
        {isEmpty ? (
          <DataEmpty
            imageClassName={styles.emptyImage}
            title={t('role_details.permission.empty')}
          />
        ) : (
          dataSource.map((resource) => (
            <ResourceItem
              key={resource.id}
              resource={resource}
              selectedScopes={getResourceSelectedScopes(resource)}
              onSelectResource={onSelectResource}
              onSelectScope={onSelectScope}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SourceScopesBox;
