import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Spin, Button, Space, Tabs, Empty, Tag, Descriptions, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import StaffProfileCard from './components/StaffProfileCard';
import CredentialReviewList from './components/CredentialReviewList';
import ReviewActions from './components/ReviewActions';
import AuditHistory from './components/AuditHistory';
import AuthImage from './components/AuthImage';
import {
  getStaffDetail,
  getStaffCredentials,
  getStaffAuditRecords,
  getStaffSkillEntries,
  getStaffIndependentSkills,
  type StaffRecord,
  type CredentialRecord,
  type AuditRecordItem,
  type SkillEntryRecord,
  type IndependentSkillRecord,
} from './services/staff';

const VALID_TABS = ['profile', 'review', 'credentials'];

const StaffDetail: React.FC = () => {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = VALID_TABS.includes(searchParams.get('tab') ?? '') ? searchParams.get('tab')! : 'profile';

  const [staff, setStaff] = useState<StaffRecord | null>(null);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecordItem[]>([]);
  const [skillEntries, setSkillEntries] = useState<SkillEntryRecord[]>([]);
  const [independentSkills, setIndependentSkills] = useState<IndependentSkillRecord[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);

  const fetchData = useCallback(async (isInitial: boolean) => {
    if (!staffId) return;
    if (isInitial) {
      setInitialLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const [staffData, credentialsData, auditData, skillEntriesData, independentSkillsData] = await Promise.all([
        getStaffDetail(staffId),
        getStaffCredentials(staffId),
        getStaffAuditRecords(staffId),
        getStaffSkillEntries(staffId),
        getStaffIndependentSkills(staffId),
      ]);
      setStaff(staffData);
      setCredentials(Array.isArray(credentialsData) ? credentialsData : []);
      setAuditRecords(Array.isArray(auditData) ? auditData : []);
      setSkillEntries(Array.isArray(skillEntriesData) ? skillEntriesData : []);
      setIndependentSkills(Array.isArray(independentSkillsData?.skills) ? independentSkillsData.skills : []);
    } catch {
      // handled by interceptor
    } finally {
      setInitialLoading(false);
      setRefreshing(false);
    }
  }, [staffId]);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key }, { replace: true });
  };

  if (initialLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!staff) {
    return (
      <div>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/staff')}
          style={{ padding: 0 }}
        >
          返回列表
        </Button>
        <Card style={{ marginTop: 16, textAlign: 'center', padding: 40 }}>
          未找到服务人员信息
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="link"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/staff')}
          style={{ padding: 0 }}
        >
          返回列表
        </Button>
      </Space>
      <Spin spinning={refreshing}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="基本信息" key="profile">
            <StaffProfileCard staff={staff} onRefresh={refresh} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="审核" key="review">
            <Card title="入驻审核" style={{ marginBottom: 16 }}>
              <ReviewActions
                staffId={staff.staffId}
                intakeStatus={staff.intakeStatus}
                onActionComplete={refresh}
              />
            </Card>
            {/* Independent skills */}
            <Card title="独立技能" style={{ marginBottom: 16 }}>
              {independentSkills.length > 0 ? (
                <Space wrap>
                  {independentSkills.map((skill) => (
                    <Tag key={skill.skillKey} color={skill.isSelected ? 'green' : 'default'}>
                      {skill.skillLabel}: {skill.isSelected ? '已选择' : '未选择'}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <span style={{ color: '#999' }}>暂未选择独立技能</span>
              )}
            </Card>
            {/* Skill entries */}
            <Card title="技能证书条目" style={{ marginBottom: 16 }}>
              {skillEntries.filter((e) => e.skillName).length > 0 ? (
                skillEntries.filter((e) => e.skillName).map((entry) => (
                  <Card
                    key={entry.entryIndex}
                    size="small"
                    title={`技能${entry.entryIndex === 1 ? '一' : entry.entryIndex === 2 ? '二' : '三'}: ${entry.skillName}`}
                    style={{ marginBottom: 8 }}
                  >
                    <Descriptions size="small" column={2}>
                      <Descriptions.Item label="技能名称">{entry.skillName}</Descriptions.Item>
                      <Descriptions.Item label="等级">{entry.skillLevel}</Descriptions.Item>
                      <Descriptions.Item label="相关工作时长">{entry.workDurationMonths ? `${entry.workDurationMonths} 月` : '-'}</Descriptions.Item>
                      <Descriptions.Item label="关联服务技能">
                        {entry.relatedServiceSkills?.length > 0
                          ? entry.relatedServiceSkills.join(', ')
                          : '-'}
                      </Descriptions.Item>
                      {entry.files && entry.files.length > 0 && (
                        <Descriptions.Item label="证书图片" span={2}>
                          <Image.PreviewGroup>
                            <Space wrap align="start">
                              {entry.files.map((f) => (
                                <div key={f.id} style={{ textAlign: 'center' }}>
                                  <AuthImage fileId={f.fileAsset.id} alt={f.fileAsset.originalName || '证书图片'} />
                                  <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                                    {f.fileAsset.originalName || '证书图片'}
                                  </div>
                                </div>
                              ))}
                            </Space>
                          </Image.PreviewGroup>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                ))
              ) : (
                <span style={{ color: '#999' }}>暂未填写技能证书条目</span>
              )}
            </Card>
            <Card title={`证件审核 (${credentials.length})`} style={{ marginBottom: 16 }}>
              {credentials.length > 0 ? (
                <CredentialReviewList
                  staffId={staff.staffId}
                  intakeStatus={staff.intakeStatus}
                  credentials={credentials}
                  onActionComplete={refresh}
                />
              ) : (
                <Empty description="暂无证件" />
              )}
            </Card>
            <Card title="审核记录">
              <AuditHistory records={auditRecords} />
            </Card>
          </Tabs.TabPane>
          <Tabs.TabPane tab="证件信息" key="credentials">
            <Card title="证件列表">
              {credentials.length > 0 ? (
                <CredentialReviewList
                  staffId={staff.staffId}
                  intakeStatus={staff.intakeStatus}
                  credentials={credentials}
                  onActionComplete={refresh}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
                  暂无证件信息
                </div>
              )}
            </Card>
          </Tabs.TabPane>
        </Tabs>
      </Spin>
    </div>
  );
};

export default StaffDetail;
